-- 3단계: 멤버 정보 단일 원본 (Google 시트 주소록 + members.json → Supabase)
-- Supabase 대시보드 → SQL Editor 에서 그대로 실행.

-- ===== 멤버 =====
create table public.members (
  id               uuid primary key default gen_random_uuid(),
  user_id          text unique references public.users(user_id) on delete set null,  -- 포털 계정 연결 (없어도 됨)
  -- ▼ 본인 편집 가능
  name_kor         text not null,
  name_eng         text,
  email            text,
  phone            text,
  kakao_id         text,
  year_joined      text,            -- "2024" / "2024.03"
  current_position text,            -- 졸업 후 소속 등
  cv_link          text,
  scholar_link     text,
  linkedin_link    text,
  orcid_link       text,
  photo_url        text,            -- R2 업로드 URL 또는 기존 /members/xxx.jpg
  research_area    text,            -- 연구분야 한 줄
  motto            text,            -- 좌우명 한 줄
  -- ▼ 교수님(admin)만 편집
  position         text not null default 'MS-PhD Student'
                   check (position in ('PI','Postdoc','PhD Student','MS-PhD Student','MS Student','Visiting Researcher','Intern','Staff')),
  degree           text not null default 'TBD'
                   check (degree in ('PhD','MS','BS','TBD','Postdoc','Visitor','Intern')),
  status           text not null default 'active' check (status in ('active','graduated')),
  year_left        text,            -- 졸업/퇴소 연도. status 가 graduated 로 바뀔 때 자동으로 올해가 들어감 (수정 가능)
  is_public        boolean not null default true,   -- 공개 Members 페이지 표시 여부
  sort_order       int,             -- null 이면 자동 정렬 (PI → Postdoc → 학생 입학년도순 → Intern/Visitor → Staff)
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()   -- "Last updated" (트리거로 자동)
);
create index members_status_idx on public.members (status);

-- ===== 단기 인턴 기록 (계정·디렉토리 없음, 공개 페이지 Former Interns 전용) =====
create table public.interns (
  id             uuid primary key default gen_random_uuid(),
  name_eng       text not null,
  name_kor       text,
  participations jsonb not null default '[]',   -- [{ "program": "MSE Intern", "period": "Summer 2025" }]
  achievements   jsonb not null default '[]',   -- [{ "type": "award" | "paper", "title": "...", "url": "..." }]
  sort_order     int,
  created_at     timestamptz not null default now()
);

-- ===== 휴가 (연도별) =====
create table public.member_vacations (
  member_id  uuid references public.members(id) on delete cascade,
  year       int not null,
  days       boolean[] not null default array[false,false,false,false,false,false,false],
  memo       text,
  updated_at timestamptz not null default now(),
  primary key (member_id, year)
);

-- ===== 트리거: updated_at 자동 갱신, graduated 전환 시 year_left 자동 =====
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create or replace function public.members_before_update() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  -- active → graduated 로 바뀌는데 year_left 가 비어 있으면 올해로
  if new.status = 'graduated' and old.status <> 'graduated' and (new.year_left is null or new.year_left = '') then
    new.year_left = to_char(now(), 'YYYY');
  end if;
  -- graduated → active 로 되돌리면 year_left 비움
  if new.status = 'active' and old.status = 'graduated' then
    new.year_left = null;
  end if;
  return new;
end $$;

create trigger members_touch before update on public.members
  for each row execute function public.members_before_update();
create trigger member_vacations_touch before update on public.member_vacations
  for each row execute function public.touch_updated_at();

-- RLS 켜고 정책 없음 → anon 키(브라우저)로는 접근 불가. 공개 페이지는 서버 컴포넌트가 공개 컬럼만 select.
alter table public.members          enable row level security;
alter table public.interns          enable row level security;
alter table public.member_vacations enable row level security;
