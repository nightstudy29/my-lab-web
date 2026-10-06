-- 005: 강의자료 공지(notice) 개선
--   - 공지는 첨부 없이 올릴 수 있어야 하므로 file_url NOT NULL 해제
--   - 공지 본문(content) 컬럼 추가 (공개 Lecture 페이지에서 제목을 누르면 펼쳐짐)

alter table public.materials alter column file_url drop not null;
alter table public.materials add column content text;
