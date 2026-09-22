// scripts/migrate-users-from-sheet.mjs
//
// Google Sheet(로그인 시트) → Supabase users 테이블로 계정 이전.
// 여러 번 실행해도 안전합니다 (user_id 기준 upsert). 배포 직전에 한 번 더 돌려서
// 그 사이 들어온 가입 신청을 반영하세요.
//
//   node scripts/migrate-users-from-sheet.mjs          # 실제 반영
//   node scripts/migrate-users-from-sheet.mjs --dry    # 반영 없이 어떻게 옮겨질지만 출력
//
// 비밀번호 해시 / OTP secret 은 화면에 출력하지 않습니다.

import "dotenv/config";
import { config } from "dotenv";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local", quiet: true });

const DRY = process.argv.includes("--dry");

const ROLE_MAP = { admin: "admin", manager: "manager", student: "member", member: "member" };
const STATUS_MAP = { pending: "pending", active: "active", blocked: "blocked", rejected: "rejected" };

// 시트의 Timestamp 는 ko-KR 문자열 (예: "2026. 1. 21. 14:03:22"). 파싱 실패 시 null.
function parseKoreanTimestamp(s) {
  if (!s) return null;
  const m = String(s).match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.?\s*(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (!m) {
    const d = new Date(s);
    return isNaN(d) ? null : d.toISOString();
  }
  const [, y, mo, d, h, mi, se] = m;
  // 시트 시간은 KST 로 기록되어 있음
  const iso = `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}T${String(h).padStart(2, "0")}:${mi}:${se || "00"}+09:00`;
  const dt = new Date(iso);
  return isNaN(dt) ? null : dt.toISOString();
}

async function main() {
  const auth = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, auth);
  await doc.loadInfo();
  const rows = await doc.sheetsByIndex[0].getRows();

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  const users = [];
  const warnings = [];

  for (const row of rows) {
    const userId = (row.get("userID") || "").trim();
    const passwordHash = (row.get("password") || "").trim();
    if (!userId || !passwordHash) {
      warnings.push(`건너뜀 (ID 또는 비번 없음): row ${row.rowNumber}`);
      continue;
    }

    const rawRole = (row.get("role") || "student").trim().toLowerCase();
    const rawStatus = (row.get("status") || "pending").trim().toLowerCase();
    const role = ROLE_MAP[rawRole];
    const status = STATUS_MAP[rawStatus];
    if (!role) warnings.push(`${userId}: 알 수 없는 role "${rawRole}" → member 로 처리`);
    if (!status) warnings.push(`${userId}: 알 수 없는 status "${rawStatus}" → pending 으로 처리`);

    const otpSecret = (row.get("otpSecret") || "").trim() || null;
    const createdAt = parseKoreanTimestamp(row.get("Timestamp"));

    users.push({
      user_id: userId,
      name: (row.get("name") || userId).trim(),
      password_hash: passwordHash,
      otp_secret: otpSecret,
      role: role || "member",
      status: status || "pending",
      ...(createdAt ? { created_at: createdAt } : {}),
      ...(status === "active" && createdAt ? { approved_at: createdAt } : {}),
    });
  }

  console.log(`\n시트에서 읽은 계정: ${users.length}건${DRY ? "  (DRY RUN — 반영 안 함)" : ""}\n`);
  console.table(
    users.map((u) => ({
      ID: u.user_id,
      이름: u.name,
      역할: u.role,
      상태: u.status,
      OTP: u.otp_secret ? "설정됨" : "미설정",
      가입일: u.created_at ? u.created_at.slice(0, 10) : "-",
    }))
  );
  if (warnings.length) console.log("주의:\n  " + warnings.join("\n  ") + "\n");

  if (DRY) return;

  const { error } = await supabase.from("users").upsert(users, { onConflict: "user_id" });
  if (error) {
    console.error("❌ Supabase upsert 실패:", error.message);
    process.exit(1);
  }

  const { count } = await supabase.from("users").select("*", { count: "exact", head: true });
  console.log(`✅ 반영 완료. Supabase users 테이블 현재 ${count}건`);
}

main().catch((e) => {
  console.error("❌ 실패:", e.message);
  process.exit(1);
});
