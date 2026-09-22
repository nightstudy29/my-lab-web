// scripts/migrate-members.mjs
//
// 멤버 정보 이전:  Google 시트 주소록(공개 CSV) + src/data/members.json  →  Supabase members / interns / member_vacations
//
//   node scripts/migrate-members.mjs --dry     # 매핑 결과만 출력 (DB 변경 없음)
//   node scripts/migrate-members.mjs           # 반영 (members 테이블이 비어 있을 때만)
//   node scripts/migrate-members.mjs --force   # 기존 members/interns/vacations 전부 지우고 다시 반영
//
// 매핑 규칙
//   - 시트 행이 기본. Eng. Name 이 같은 members.json 항목이 있으면 사진/링크/직함(position)을 보충.
//   - users.name(한국 이름) 과 시트 Name 이 같으면 user_id 연결.
//   - members.json 에만 있는 사람(교수님/스태프 등)도 members 행으로 추가.
//   - members.json interns → interns 테이블.
//   - 시트 V1~V7 / V_Memo / V_Year → member_vacations (체크나 메모가 하나라도 있을 때만).

import { config } from "dotenv";
import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local", quiet: true });

const DRY = process.argv.includes("--dry");
const FORCE = process.argv.includes("--force");

const CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vSZFKBBsoaoqe9PV4aOz92jS-k5yMr6ynih1NBSFr7490KdMFkRHKsSwyBRha0CTgP-_WlvIiOoUwwh/pub?gid=0&single=true&output=csv";

const DEGREE_MAP = { phd: "PhD", ms: "MS", bs: "BS", tbd: "TBD", postdoc: "Postdoc", visitor: "Visitor", intern: "Intern" };
const POSITION_FROM_ROLE = {
  "principal investigator": "PI",
  "ms-phd student": "MS-PhD Student",
  "phd student": "PhD Student",
  "ms student": "MS Student",
  "administrative staff": "Staff",
  "postdoc": "Postdoc",
  "visiting researcher": "Visiting Researcher",
  "intern": "Intern",
};
// members.json 에 없는 사람의 position 은 degree 로 추정 (검토용으로 경고 출력)
const POSITION_FROM_DEGREE = { PhD: "PhD Student", MS: "MS Student", BS: "Intern", TBD: "MS-PhD Student", Postdoc: "Postdoc", Visitor: "Visiting Researcher", Intern: "Intern" };

const norm = (s) => (s || "").toLowerCase().replace(/\s+/g, " ").trim();
const blank = (s) => (s && String(s).trim()) || null;

// labportal 과 같은 CSV 파서 (따옴표 안 콤마 보존)
function parseCsv(text) {
  const rows = text.split(/\r?\n/);
  const headerIdx = rows.findIndex((r) => r.includes("Name") && r.includes("E-mail"));
  if (headerIdx === -1) throw new Error("CSV 헤더(Name, E-mail)를 찾을 수 없습니다.");
  const split = (line) => line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((c) => c.replace(/^"|"$/g, "").trim());
  const headers = split(rows[headerIdx]);
  return rows
    .slice(headerIdx + 1)
    .map(split)
    .map((cols) => Object.fromEntries(headers.map((h, i) => [h, cols[i] ?? ""])))
    .filter((r) => r["Name"]);
}

async function main() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const warnings = [];

  // ---- 소스 읽기 ----
  const csvText = await (await fetch(CSV_URL)).text();
  const sheetRows = parseCsv(csvText);
  const json = JSON.parse(readFileSync("src/data/members.json", "utf8"));
  const { data: users } = await supabase.from("users").select("user_id, name");
  const usersByName = new Map((users || []).map((u) => [norm(u.name), u.user_id]));

  const jsonByEng = new Map((json.currentMembers || []).map((m) => [norm(m.name), m]));
  const usedJson = new Set();

  // ---- 시트 행 → members ----
  const members = [];
  const vacations = []; // { nameKor, year, days, memo }  (id 는 insert 후 매핑)

  for (const r of sheetRows) {
    const nameKor = r["Name"].trim();
    const nameEng = blank(r["Eng. Name"]);
    const status = norm(r["Status"]) === "graduated" ? "graduated" : "active";
    const degreeRaw = norm(r["Degree"]);
    const degree = DEGREE_MAP[degreeRaw] || "TBD";
    if (degreeRaw && !DEGREE_MAP[degreeRaw]) warnings.push(`${nameKor}: 시트 Degree "${r["Degree"]}" 를 모름 → TBD`);

    const j = nameEng ? jsonByEng.get(norm(nameEng)) : null;
    if (j) usedJson.add(norm(j.name));

    let position = j ? POSITION_FROM_ROLE[norm(j.role)] : null;
    if (!position) {
      position = POSITION_FROM_DEGREE[degree] || "MS-PhD Student";
      if (status === "active") warnings.push(`${nameKor}: members.json 에 없어 position 을 degree(${degree})로 추정 → ${position}  ※ Directory Master 에서 확인`);
    }

    const userId = usersByName.get(norm(nameKor)) || null;

    members.push({
      user_id: userId,
      name_kor: nameKor,
      name_eng: nameEng || (j?.name ?? null),
      email: blank(r["E-mail"]) || blank(j?.email),
      phone: blank(r["Phone"]),
      kakao_id: blank(r["Kakao ID"]),
      year_joined: blank(r["Year Joined"]) || blank(j?.joined),
      current_position: blank(r["Current Position"]),
      cv_link: blank(r["CV_Link"]) || blank(j?.links?.cv),
      scholar_link: blank(r["Scholar_Link"]) || blank(j?.links?.googleScholar),
      linkedin_link: blank(r["Linkedin_Link"]) || blank(j?.links?.linkedin),
      orcid_link: blank(r["ORCID_Link"]) || blank(j?.links?.orcid),
      photo_url: blank(j?.image),
      research_area: blank(j?.area),
      position,
      degree,
      status,
      is_public: true,
    });

    const days = ["V1", "V2", "V3", "V4", "V5", "V6", "V7"].map((k) => r[k] === "TRUE");
    const memo = blank(r["V_Memo"]);
    if (days.some(Boolean) || memo) {
      vacations.push({ nameKor, year: Number(r["V_Year"]) || new Date().getFullYear(), days, memo });
    }
  }

  // ---- members.json 에만 있는 사람 (교수님, 스태프 등) ----
  for (const j of json.currentMembers || []) {
    if (usedJson.has(norm(j.name))) continue;
    const position = POSITION_FROM_ROLE[norm(j.role)] || "Staff";
    const nameKor = j.nameKor || j.name; // 한국 이름이 없으면 영어 이름으로 (Directory Master 에서 수정)
    warnings.push(`${j.name}: 시트에 없어 members.json 만으로 추가 (position ${position}). 한국 이름/연락처는 Directory Master 에서 채워주세요`);
    members.push({
      user_id: usersByName.get(norm(nameKor)) || null,
      name_kor: nameKor,
      name_eng: j.name,
      email: blank(j.email),
      year_joined: blank(j.joined),
      cv_link: blank(j.links?.cv),
      scholar_link: blank(j.links?.googleScholar),
      linkedin_link: blank(j.links?.linkedin),
      orcid_link: blank(j.links?.orcid),
      photo_url: blank(j.image),
      research_area: blank(j.area),
      position,
      degree: position === "PI" ? "PhD" : "TBD",
      status: "active",
      is_public: true,
    });
  }

  // 교수님 계정(admin)이 연결됐는지 확인
  const admin = (users || []).find((u) => u.user_id === "junminsuh");
  if (admin && !members.some((m) => m.user_id === admin.user_id)) {
    warnings.push(`admin 계정(${admin.user_id}, ${admin.name})이 어느 멤버 행에도 연결되지 않았습니다 → Directory Master 에서 연결`);
  }

  // ---- interns ----
  const interns = (json.interns || []).map((it, i) => ({
    name_eng: it.name,
    participations: it.participations || [],
    achievements: it.achievements || [],
    sort_order: i,
  }));

  // ---- 출력 ----
  console.log(`\n시트 ${sheetRows.length}행 + members.json ${json.currentMembers?.length ?? 0}명 → members ${members.length}건, interns ${interns.length}건, vacations ${vacations.length}건${DRY ? "  (DRY RUN)" : ""}\n`);
  console.table(
    members.map((m) => ({
      이름: m.name_kor,
      영어: m.name_eng || "-",
      position: m.position,
      degree: m.degree,
      status: m.status,
      입학: m.year_joined || "-",
      계정: m.user_id || "-",
      사진: m.photo_url ? "O" : "-",
      링크: ["cv_link", "scholar_link", "linkedin_link", "orcid_link"].filter((k) => m[k]).length,
      연락처: [m.email && "✉", m.phone && "☎", m.kakao_id && "K"].filter(Boolean).join(""),
    }))
  );
  console.log("interns:", interns.map((i) => i.name_eng).join(", "));
  if (vacations.length) console.log("vacations:", vacations.map((v) => `${v.nameKor}(${v.year}: ${v.days.filter(Boolean).length}일${v.memo ? ", 메모" : ""})`).join(", "));
  if (warnings.length) console.log("\n⚠ 확인 필요:\n  " + warnings.join("\n  "));

  if (DRY) return;

  // ---- 반영 ----
  const { count: existing } = await supabase.from("members").select("*", { count: "exact", head: true });
  if (existing > 0) {
    if (!FORCE) {
      console.error(`\n❌ members 테이블에 이미 ${existing}건이 있습니다. 덮어쓰려면 --force (기존 데이터 삭제됨).`);
      process.exit(1);
    }
    await supabase.from("member_vacations").delete().neq("year", -1);
    await supabase.from("members").delete().neq("name_kor", "");
    await supabase.from("interns").delete().neq("name_eng", "");
    console.log(`\n기존 데이터 삭제 (--force)`);
  }

  const { data: inserted, error: e1 } = await supabase.from("members").insert(members).select("id, name_kor");
  if (e1) { console.error("❌ members insert 실패:", e1.message); process.exit(1); }

  const idByName = new Map(inserted.map((m) => [m.name_kor, m.id]));
  const vacRows = vacations.map((v) => ({ member_id: idByName.get(v.nameKor), year: v.year, days: v.days, memo: v.memo })).filter((v) => v.member_id);
  if (vacRows.length) {
    const { error: e2 } = await supabase.from("member_vacations").insert(vacRows);
    if (e2) { console.error("❌ vacations insert 실패:", e2.message); process.exit(1); }
  }
  if (interns.length) {
    const { error: e3 } = await supabase.from("interns").insert(interns);
    if (e3) { console.error("❌ interns insert 실패:", e3.message); process.exit(1); }
  }

  console.log(`\n✅ 반영 완료: members ${inserted.length}, vacations ${vacRows.length}, interns ${interns.length}`);
}

main().catch((e) => { console.error("❌ 실패:", e.message); process.exit(1); });
