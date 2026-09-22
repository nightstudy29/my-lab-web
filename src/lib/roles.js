// src/lib/roles.js
//
// 역할 정의. 클라이언트/서버 어디서든 import 가능 (비밀 없음).
//   admin   — 교수. 전부.
//   manager — 방장. 논문·특허·뉴스 관리 (+ 그에 필요한 사진 업로드).
//   member  — 연구원. 포털 열람, 수정 요청.

export const ROLES = ["admin", "manager", "member"];
export const ROLE_LABELS = { admin: "교수", manager: "방장", member: "연구원" };

// 콘텐츠(논문/특허/뉴스) 관리 권한
export const CONTENT_ROLES = ["admin", "manager"];

export const STATUS_LABELS = {
  pending: "승인 대기",
  active: "활성",
  blocked: "차단",
  rejected: "거절됨",
};

export function canManageContent(role) {
  return CONTENT_ROLES.includes(role);
}
