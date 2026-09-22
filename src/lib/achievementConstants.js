// src/lib/achievementConstants.js
//
// 논문 업적 필드 / 학술발표 필드 정의. 클라이언트·서버 공용.

export const PUB_TYPES = ["SCIE", "ESCI", "SCOPUS", "KCI", "기타", "미분류"];
export const ROLES = ["제1저자", "교신저자", "공동저자"];
export const QUARTILES = ["Q1", "Q2", "Q3", "Q4"];

// papers 테이블의 업적 컬럼 (API 화이트리스트와 동일)
export const ACH_FIELDS = [
  "pub_type", "institution", "submitted_on", "published_on", "volume_pages", "issn", "eissn",
  "author_count", "role", "funding",
  "if_submit", "jcr_submit", "quartile_submit", "if_publish", "jcr_publish", "quartile_publish", "notes",
];
export const ACH_NUMERIC = ["author_count", "if_submit", "if_publish"];

export const ACH_LABELS = {
  pub_type: "게재지구분", institution: "기관", submitted_on: "투고일", published_on: "발표일",
  volume_pages: "권/호/쪽", issn: "ISSN", eissn: "EISSN", author_count: "저자수", role: "역할", funding: "사사",
  if_submit: "IF (투고 시)", jcr_submit: "JCR (투고 시)", quartile_submit: "Quartile (투고 시)",
  if_publish: "IF (게재 시)", jcr_publish: "JCR (게재 시)", quartile_publish: "Quartile (게재 시)", notes: "메모",
};

// 주저자 = 제1저자 + 교신저자
export const isLeadRole = (role) => role === "제1저자" || role === "교신저자";

// 업적 정보가 "입력됨" 으로 볼 최소 조건
export const hasAchievement = (p) => !!(p.role || p.pub_type || p.if_publish != null);

// ===== 학술발표 =====
export const TALK_FIELDS = ["conference", "country", "venue", "organizer", "period_start", "period_end", "title", "presented_on", "author_count", "project", "travel_project", "notes"];
export const TALK_LABELS = {
  conference: "학술대회명", country: "개최국", venue: "개최장소", organizer: "개최기관명",
  period_start: "개최기간 (시작)", period_end: "개최기간 (종료)", title: "발표제목", presented_on: "발표일자",
  author_count: "전체저자수", project: "관련과제", travel_project: "출장과제", notes: "메모",
};

// ===== CSV 내보내기 (Excel 호환, BOM 포함) =====
const csvCell = (v) => {
  if (v == null) return "";
  const s = String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
export function toCsv(headers, rows) {
  return "﻿" + [headers, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");
}
export function downloadCsv(filename, csv) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}
// 시트 표기(2016/02/12)로
export const fmtSheetDate = (iso) => (iso ? String(iso).slice(0, 10).replace(/-/g, "/") : "");
