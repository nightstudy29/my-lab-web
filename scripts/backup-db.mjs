// scripts/backup-db.mjs
//
// Supabase 전 테이블을 JSON 으로 내려받아 backups/<날짜-시각>/ 에 저장합니다.
// (Supabase 무료 플랜은 자동 백업이 없어서, 중요한 입력 후나 학기 초에 한 번씩 돌려 두세요.)
//
//   node scripts/backup-db.mjs
//
// 결과: backups/2026-09-23_1530/{users,members,...}.json + _summary.json
// backups/ 는 .gitignore 에 있어 git 에는 올라가지 않습니다 → Google Drive 등 안전한 곳에 복사해 두세요.
// users.json 에는 비밀번호 해시와 OTP secret 이 포함되니 공개된 곳에 두지 마세요.

import { config } from "dotenv";
import { mkdirSync, writeFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";
config({ path: ".env.local", quiet: true });

const TABLES = ["users", "members", "interns", "member_vacations", "papers", "patents", "news", "semesters", "courses", "materials", "content_requests", "talks"];

async function main() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const stamp = new Date().toISOString().slice(0, 16).replace("T", "_").replace(":", "");
  const dir = `backups/${stamp}`;
  mkdirSync(dir, { recursive: true });

  const summary = {};
  for (const t of TABLES) {
    // 1000행 단위 페이지네이션 (PostgREST 기본 제한)
    const rows = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await sb.from(t).select("*").range(from, from + 999);
      if (error) throw new Error(`${t}: ${error.message}`);
      rows.push(...(data || []));
      if (!data || data.length < 1000) break;
    }
    writeFileSync(`${dir}/${t}.json`, JSON.stringify(rows, null, 2));
    summary[t] = rows.length;
    console.log(`${t.padEnd(18)} ${rows.length}행`);
  }
  writeFileSync(`${dir}/_summary.json`, JSON.stringify({ backedUpAt: new Date().toISOString(), tables: summary }, null, 2));
  console.log(`\n✅ 저장 위치: ${dir}/  (Google Drive 등에 복사해 두세요)`);
}

main().catch((e) => { console.error("❌ 백업 실패:", e.message); process.exit(1); });
