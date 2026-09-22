// scripts/import-paper-achievements.mjs
//
// 업적정리 Google 시트(공개 링크) → Supabase papers 의 업적 컬럼 채우기.
// 논문 매칭: DOI → 없으면 제목(정규화). 매칭된 행만 update. 여러 번 실행해도 안전.
//
//   node scripts/import-paper-achievements.mjs --dry    # 매핑 결과만 출력
//   node scripts/import-paper-achievements.mjs          # 반영

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
config({ path: ".env.local", quiet: true });

const SHEET_ID = "1DDba1qoHCevHPX5Aug2nn9RTx4AJhYrHkUZTT3X4Xv8";
const DRY = process.argv.includes("--dry");

const parseCsv = (t) => t.split(/\r?\n/).map((l) => { const o = []; let c = "", q = false; for (const ch of l) { if (ch === "\"") { q = !q; continue; } if (ch === "," && !q) { o.push(c); c = ""; } else c += ch; } o.push(c); return o; });
const norm = (s) => (s || "").toLowerCase().replace(/<[^>]+>/g, "").replace(/[^a-z0-9]/g, "");
const doiKey = (s) => { const m = (s || "").match(/10\.\d{4,}[^\s]*/); return m ? m[0].toLowerCase().replace(/\/$/, "") : null; };
const blank = (s) => { const v = (s || "").trim(); return v && v !== "-" && v !== "N/A" ? v : null; };
const num = (s) => { const v = blank(s); if (!v) return null; const n = Number(v.replace(/,/g, "")); return Number.isFinite(n) ? n : null; };
const date = (s) => { const v = blank(s); if (!v) return null; const m = v.match(/(\d{4})[./-](\d{1,2})(?:[./-](\d{1,2}))?/); if (!m) return null; return `${m[1]}-${String(m[2]).padStart(2, "0")}-${String(m[3] || 1).padStart(2, "0")}`; };
const PUB_TYPE = (s) => { const v = blank(s); if (!v) return "미분류"; if (/분류전/.test(v)) return "미분류"; return v; };
const QUART = (s) => { const v = blank(s); return v && /^Q[1-4]$/.test(v) ? v : null; };
const JCR = (s) => { const v = blank(s); return v && v.includes("/") ? v : null; };
// JCR/Quartile 칸에 연도만 적혀 있으면 "해당 연도 JCR 미확정" 메모로
const PENDING = (s) => { const v = blank(s); return v && /^20\d{2}$/.test(v) ? `JCR ${v} 미확정` : null; };
const ROLE = (s) => { const v = blank(s); if (!v) return null; if (/제\s*1\s*저자|1저자|first/i.test(v)) return "제1저자"; if (/교신/.test(v)) return "교신저자"; return "공동저자"; };

async function main() {
  const csv = await (await fetch(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`)).text();
  if (csv.includes("<html")) throw new Error("시트에 접근할 수 없습니다 (공유 설정 확인).");
  const rows = parseCsv(csv);
  const hdrIdx = rows.findIndex((r) => r[1] === "#");
  const H = rows[hdrIdx];
  const sheet = rows.slice(hdrIdx + 1).filter((r) => r[1] && r[7]).map((r) => Object.fromEntries(H.map((h, i) => [h, r[i]])));

  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { data: papers, error } = await sb.from("papers").select("id, year, title, journal, url");
  if (error) throw error;
  const byDoi = new Map(papers.map((p) => [doiKey(p.url), p]).filter(([k]) => k));
  const byTitle = new Map(papers.map((p) => [norm(p.title), p]));

  const updates = [], unmatched = [], duplicates = [];
  // DOI 매칭 행을 먼저 처리하고, 제목 매칭이 이미 차지된 논문에 붙으면 건너뛰고 보고 (시트/웹 DOI 오기 탐지)
  const matched = new Map(); // paper.id -> 시트 #
  const ordered = [...sheet.filter((r) => byDoi.has(doiKey(r["DOI"]))), ...sheet.filter((r) => !byDoi.has(doiKey(r["DOI"])))];
  for (const r of ordered) {
    const p = byDoi.get(doiKey(r["DOI"])) || byTitle.get(norm(r["제목"]));
    if (!p) { unmatched.push(`#${r["#"]} ${r["서지년도"]} ${r["제목"].slice(0, 60)}`); continue; }
    if (matched.has(p.id)) { duplicates.push(`시트 #${r["#"]} "${r["제목"].slice(0, 50)}" → #${matched.get(p.id)} 와 같은 논문에 매칭되어 건너뜀 (DOI 확인 필요)`); continue; }
    matched.set(p.id, r["#"]);
    updates.push({
      id: p.id, _title: p.title.replace(/<[^>]+>/g, "").slice(0, 50), _year: p.year,
      pub_type: PUB_TYPE(r["게재지구분"]), institution: blank(r["기관"]),
      submitted_on: date(r["투고년월"]), published_on: date(r["발표년월"]),
      volume_pages: blank(r["권/호/쪽"]), issn: blank(r["ISSN"]), eissn: blank(r["EISSN"]),
      author_count: num(r["저자수"]), role: ROLE(r["역할"]), funding: blank(r["사사"]),
      if_submit: num(r["IF (Submit)"]), jcr_submit: JCR(r["JCR"]), quartile_submit: QUART(r["Quartile"]),
      // 시트에 JCR/Quartile 컬럼이 두 번 있어 뒤쪽(게재 시)은 인덱스로 읽음
      if_publish: num(r["IF (Publish)"]),
      jcr_publish: JCR(rows[hdrIdx + 1 + sheet.indexOf(r)][H.lastIndexOf("JCR")]),
      quartile_publish: QUART(rows[hdrIdx + 1 + sheet.indexOf(r)][H.lastIndexOf("Quartile")]),
      notes: PENDING(rows[hdrIdx + 1 + sheet.indexOf(r)][H.lastIndexOf("Quartile")]),
      // DOI 가 웹사이트에 없으면 채움
      url: p.url || (blank(r["DOI"]) ? (r["DOI"].startsWith("http") ? r["DOI"] : `https://doi.org/${r["DOI"]}`) : null),
    });
  }

  console.log(`\n시트 ${sheet.length}편 → 매칭 ${updates.length}, 미매칭 ${unmatched.length}${DRY ? "  (DRY RUN)" : ""}`);
  const roleCount = updates.reduce((a, u) => { a[u.role || "(없음)"] = (a[u.role || "(없음)"] || 0) + 1; return a; }, {});
  const typeCount = updates.reduce((a, u) => { a[u.pub_type] = (a[u.pub_type] || 0) + 1; return a; }, {});
  console.log("역할:", JSON.stringify(roleCount), "| 구분:", JSON.stringify(typeCount));
  console.log("IF(게재) 있음:", updates.filter((u) => u.if_publish != null).length, "| 투고일 파싱:", updates.filter((u) => u.submitted_on).length, "| 발표일 파싱:", updates.filter((u) => u.published_on).length);
  console.table(updates.slice(0, 5).map((u) => ({ 연도: u._year, 제목: u._title, 구분: u.pub_type, 기관: u.institution, 역할: u.role, 투고: u.submitted_on, 발표: u.published_on, IF: u.if_publish, Q: u.quartile_publish, 저자수: u.author_count })));
  if (unmatched.length) console.log("미매칭:\n  " + unmatched.join("\n  "));
  if (duplicates.length) console.log("⚠ 중복/건너뜀:\n  " + duplicates.join("\n  "));
  const noAch = papers.filter((p) => !updates.some((u) => u.id === p.id));
  console.log(`웹사이트에만 있는 논문 (업적 미입력으로 남음): ${noAch.length}편 — ` + noAch.map((p) => `${p.year} ${p.title.replace(/<[^>]+>/g, "").slice(0, 40)}`).join(" | "));

  if (DRY) return;
  let ok = 0;
  for (const u of updates) {
    const { _title, _year, id, ...fields } = u;
    const { error: e } = await sb.from("papers").update(fields).eq("id", id);
    if (e) { console.error("❌", _title, e.message); continue; }
    ok++;
  }
  console.log(`\n✅ 반영 완료: ${ok}/${updates.length}`);
}

main().catch((e) => { console.error("❌ 실패:", e.message); process.exit(1); });
