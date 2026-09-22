-- 004: 3~4단계 이후 SQL Editor 에서 직접 실행한 스키마 변경 모음 (기록용).
-- 이미 적용된 DB 에 다시 실행하지 마세요.

-- members: Co-advisor (교수님 전용)
alter table public.members add column co_advisor text;

-- materials: 주차 입력을 없애면서 NOT NULL 해제
alter table public.materials alter column week drop not null;

-- papers: 업적 컬럼 (Admin 「업적」 탭 / CSV 내보내기용. 공개 페이지 미노출)
alter table public.papers
  add column pub_type         text,      -- 게재지구분: SCIE / ESCI / SCOPUS / KCI / 기타 / 미분류
  add column institution      text,      -- 기관: SNU / MIT / SNUTI …
  add column submitted_on     date,      -- 투고년월
  add column published_on     date,      -- 발표년월
  add column volume_pages     text,      -- 권/호/쪽
  add column issn             text,
  add column eissn            text,
  add column author_count     int,
  add column role             text check (role in ('제1저자','교신저자','공동저자')),
  add column funding          text,      -- 사사
  add column if_submit        numeric,
  add column jcr_submit       text,
  add column quartile_submit  text,
  add column if_publish       numeric,
  add column jcr_publish      text,
  add column quartile_publish text,
  add column notes            text;

-- talks: 학술발표 (admin 전용, RLS 정책 없음 → 서버만 접근)
create table public.talks (
  id             uuid primary key default gen_random_uuid(),
  conference     text not null,          -- 학술대회명
  country        text,                   -- 개최국
  venue          text,                   -- 개최장소
  organizer      text,                   -- 개최기관명
  period_start   date,                   -- 개최기간 (시작)
  period_end     date,                   -- 개최기간 (종료)
  title          text not null,          -- 발표제목
  presented_on   date,                   -- 발표일자
  author_count   int,                    -- 전체저자수
  project        text,                   -- 관련과제
  travel_project text,                   -- 출장과제
  notes          text,
  created_at     timestamptz not null default now()
);
alter table public.talks enable row level security;
