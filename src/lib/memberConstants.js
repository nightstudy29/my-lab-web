// src/lib/memberConstants.js
//
// 멤버 정보 관련 상수. 클라이언트/서버 어디서든 import 가능.
//
//   position — 현재 신분 (공개 페이지 직함·정렬 기준)   : 교수님만 편집
//   degree   — 최종 학위 (Directory / Alumni 분류)        : 교수님만 편집
//   status   — 재적 여부                                   : 교수님만 편집

export const POSITIONS = ["PI", "Postdoc", "PhD Student", "MS-PhD Student", "MS Student", "Visiting Researcher", "Intern", "Staff"];
export const POSITION_LABELS_EN = {
  PI: "Principal Investigator",
  Postdoc: "Postdoctoral Researcher",
  "PhD Student": "PhD Student",
  "MS-PhD Student": "MS-PhD Student",
  "MS Student": "MS Student",
  "Visiting Researcher": "Visiting Researcher",
  Intern: "Intern",
  Staff: "Administrative Staff",
};
export const POSITION_LABELS_KO = {
  PI: "교수",
  Postdoc: "박사후연구원",
  "PhD Student": "박사과정",
  "MS-PhD Student": "석박통합",
  "MS Student": "석사과정",
  "Visiting Researcher": "방문연구원",
  Intern: "인턴",
  Staff: "행정",
};
// 공개 페이지 정렬: PI → Postdoc → 학생(입학년도순, degree 무관) → Intern/Visitor → Staff
const POSITION_RANK = { PI: 0, Postdoc: 1, "PhD Student": 2, "MS-PhD Student": 2, "MS Student": 2, "Visiting Researcher": 3, Intern: 3, Staff: 4 };

export const DEGREES = ["PhD", "MS", "BS", "TBD", "Postdoc", "Visitor", "Intern"];
export const STATUSES = ["active", "graduated"];
export const MEMBER_STATUS_LABELS = { active: "Active", graduated: "Graduated" };

// 본인이 포털 「Account」에서 편집할 수 있는 필드 (API 화이트리스트와 동일)
export const SELF_EDITABLE_FIELDS = [
  "name_kor", "name_eng", "email", "phone", "kakao_id",
  "cv_link", "scholar_link", "linkedin_link", "orcid_link", "photo_url", "research_area", "motto",
];
// 교수님만 편집 (입학/합류 시기, 현재 소속·직위 포함)
export const ADMIN_ONLY_FIELDS = [
  "position", "degree", "status", "year_joined", "year_left", "current_position", "is_public", "sort_order", "user_id",
];

// 「Account」 배너용 — 이게 비어 있으면 "정보를 채워주세요"
export const REQUIRED_PROFILE_FIELDS = ["name_eng", "email", "phone"];

// "2025-1" / "2025.03" / "2025" 같은 문자열을 정렬 가능한 숫자로
export function yearKey(yearJoined) {
  const m = String(yearJoined || "").match(/(\d{4})\D*(\d{1,2})?/);
  if (!m) return 99999;
  return Number(m[1]) * 100 + (Number(m[2]) || 0);
}

export function compareMembers(a, b) {
  const r = (POSITION_RANK[a.position] ?? 9) - (POSITION_RANK[b.position] ?? 9);
  if (r !== 0) return r;
  const sa = a.sort_order ?? a.sortOrder, sb = b.sort_order ?? b.sortOrder;
  if (sa != null || sb != null) {
    if (sa == null) return 1;
    if (sb == null) return -1;
    if (sa !== sb) return sa - sb;
  }
  const y = yearKey(a.year_joined ?? a.yearJoined) - yearKey(b.year_joined ?? b.yearJoined);
  if (y !== 0) return y;
  return String(a.name_eng ?? a.nameEng ?? "").localeCompare(String(b.name_eng ?? b.nameEng ?? ""));
}
