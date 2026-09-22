-- 2단계: 인증 DB를 Google Sheet → Supabase로 이전
-- Supabase 대시보드 → SQL Editor 에서 그대로 실행.
-- (001은 이미 존재하는 news/papers/patents/semesters/courses/materials 테이블 — 대시보드에서 직접 만들어짐)

-- ===== 계정 =====
create table public.users (
  id                   uuid primary key default gen_random_uuid(),
  user_id              text unique not null,          -- 로그인 ID
  name                 text not null,
  password_hash        text not null,                 -- bcrypt
  otp_secret           text,                          -- null = 미설정 (다음 로그인 때 QR 등록)
  role                 text not null default 'member'
                       check (role in ('admin','manager','member')),
  status               text not null default 'pending'
                       check (status in ('pending','active','blocked','rejected')),
  must_change_password boolean not null default false, -- 관리자 초기화 후 첫 로그인 때 변경 강제
  rejected_reason      text,
  registration_ip      text,                          -- 가입 스팸 제한용
  created_at           timestamptz not null default now(),
  approved_at          timestamptz,
  last_login_at        timestamptz
);
create index users_status_idx on public.users (status);

-- ===== 위키/가이드 수정 요청 =====
create table public.content_requests (
  id              uuid primary key default gen_random_uuid(),
  requester_id    text not null,                      -- users.user_id
  requester_name  text not null,
  category        text not null,                      -- 'Newbie Guide' | 'Lab Wiki'
  content         text not null,
  status          text not null default 'open' check (status in ('open','resolved')),
  created_at      timestamptz not null default now(),
  resolved_at     timestamptz
);
create index content_requests_status_idx on public.content_requests (status);

-- RLS 켜고 정책은 만들지 않음 → anon 키(브라우저)로는 접근 불가, 서버(service_role)만 읽고 씀
alter table public.users            enable row level security;
alter table public.content_requests enable row level security;
