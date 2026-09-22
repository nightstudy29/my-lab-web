// src/lib/memberShapes.js
//
// members 테이블 행 → 용도별 응답 모양. 서버(API/서버 컴포넌트)에서만 사용.
//   toPublic    공개 Members 페이지 (전화/카카오 제외)
//   toDirectory 포털 Directory (로그인 멤버; 연락처 포함)
//   toAdmin     Directory Master (전부)

import { POSITION_LABELS_EN } from "@/lib/memberConstants";

export const MEMBER_COLUMNS =
  "id, user_id, name_kor, name_eng, email, phone, kakao_id, year_joined, current_position, " +
  "cv_link, scholar_link, linkedin_link, orcid_link, photo_url, " +
  "position, degree, status, year_left, co_advisor, is_public, sort_order, created_at, updated_at";

function links(row) {
  return {
    cv: row.cv_link || null,
    scholar: row.scholar_link || null,
    linkedin: row.linkedin_link || null,
    orcid: row.orcid_link || null,
  };
}

export function toPublic(row) {
  return {
    id: row.id,
    nameKor: row.name_kor,
    nameEng: row.name_eng,
    position: row.position,
    positionLabel: POSITION_LABELS_EN[row.position] || row.position,
    degree: row.degree,
    status: row.status,
    yearJoined: row.year_joined,
    yearLeft: row.year_left,
    currentPosition: row.current_position,
    coAdvisor: row.co_advisor,
    email: row.email,
    photoUrl: row.photo_url,
    links: links(row),
    sortOrder: row.sort_order,
  };
}

export function toDirectory(row) {
  return {
    ...toPublic(row),
    phone: row.phone,
    kakaoId: row.kakao_id,
    updatedAt: row.updated_at,
  };
}

export function toAdmin(row) {
  return {
    ...toDirectory(row),
    userId: row.user_id,
    isPublic: row.is_public,
    createdAt: row.created_at,
    // 편집 폼에서 그대로 쓰기 좋게 원본 컬럼명도 함께
    raw: { ...row },
  };
}
