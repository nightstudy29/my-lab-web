# SMID Lab Website

서울대학교 재료공학부 **SMID Lab**(Semiconductor Materials & Intelligent Devices) 홈페이지 + 연구실 포털.
Next.js 16(App Router) · Supabase(Postgres) · Cloudflare R2 · Vercel.

- 공개 사이트: https://smid.snu.ac.kr
- 포털(로그인): `/login` → `/labportal`

## 구조

```
src/
  app/
    page.js                 홈 (Supabase news 최신 3건)
    research/ members/ publications/ lecture/ news/ contact/ equipment/   공개 페이지
    login/                  ID+비밀번호 → OTP 2단계 로그인, 가입 신청
    labportal/              포털: Newbie Guide · Rules · Wiki · Directory · Account · Admin
    api/                    서버 라우트 (아래 표)
  components/
    ui/                     Admin 공통 UI 키트 (Button/Input/Table/Badge/SlidePanel/Toast/Confirm/RichTextInput)
    *Admin.js               Admin 각 메뉴 (Papers/Patents/News/ClassMaterial/Accounts/Approvals/Requests/
                            DirectoryMaster/Vacation/Achievements/Dashboard)
    FileUploader.js         드래그앤드롭 업로더 (R2 직접 업로드, 순서 지정, 진행률)
    MemberCard.js MemberDirectory.js MyProfileForm.js ChangePasswordForm.js
  lib/
    auth.js                 세션 쿠키(JWT) · requireRole/requireAdmin/requireLogin
    supabaseAdmin.js        service_role 클라이언트 (서버 전용)   supabaseClient.js  anon (브라우저 읽기)
    r2Client.js uploadClient.js   R2 삭제 / 브라우저 업로드·리사이즈
    apiClient.js            브라우저 → /api 호출 헬퍼 (에러 throw)
    roles.js memberConstants.js achievementConstants.js memberShapes.js sanitizeHtml.js
  proxy.js                  CSP 등 보안 헤더 (Next 16 의 middleware)
  data/*.json               정적 콘텐츠 (뉴비 가이드, 규칙, 위키, 연구, 장비)
supabase/*.sql              스키마 변경 기록 (SQL Editor 에서 실행한 순서대로)
scripts/                    import-paper-achievements.mjs (업적 시트 → papers), backup-db.mjs (전 테이블 JSON 백업)
```

## 인증 / 권한

- 계정은 Supabase `users` 테이블. 로그인은 bcrypt 비밀번호 → TOTP(Google Authenticator) 2단계.
  중간 단계는 서버 서명 토큰으로만 이어지며, 성공 시 **httpOnly 세션 쿠키**(3h) 발급.
- 역할: `admin`(교수) · `manager`(방장: 논문/특허/뉴스) · `member`.
  모든 쓰기 API 는 `requireRole()` 로 서버에서 검사하고 DB 의 현재 status/role 을 다시 읽음.
- 가입 신청 → admin 승인 → `members` 행 자동 생성 → 본인이 Account 탭에서 정보 입력.
- 비밀번호/OTP 분실은 admin 이 「계정 관리」에서 초기화(임시 비밀번호 1회 표시).

## 데이터

| 테이블 | 내용 | 브라우저(anon) 읽기 |
|---|---|---|
| `news` `papers` `patents` `semesters` `courses` `materials` | 공개 콘텐츠 (papers 에 업적 컬럼 포함) | SELECT 정책 있음 |
| `users` | 계정 (해시·OTP secret) | 불가 — 서버만 |
| `members` `interns` `member_vacations` | 멤버 정보 / 단기 인턴 기록 / 휴가 | 불가 — 서버만 (공개 페이지는 서버 컴포넌트가 공개 컬럼만) |
| `content_requests` `talks` | 수정 요청 / 학술발표 | 불가 — 서버만 |

파일(강의자료, 뉴스 사진, 프로필 사진)은 Cloudflare R2. 브라우저가 `/api/upload-url` 로 presigned URL 을 받아 **직접 PUT** 합니다 (Vercel 4.5MB 제한 무관). 버킷 CORS 에 사이트 도메인의 PUT 허용 필요.

공개 Members 페이지는 ISR(60s) + 멤버 변경 API 에서 `revalidatePath("/members")` 즉시 갱신.

## API 요약

| 경로 | 권한 | 설명 |
|---|---|---|
| `POST /api/login` `POST /api/register` | 공개 | 로그인 2단계 / 가입 신청 (IP당 24h 5건) |
| `GET/DELETE /api/session` | 공개 | 세션 조회(비로그인 `user:null`) / 로그아웃 |
| `POST /api/account/password` | 로그인 | 본인 비밀번호 변경 |
| `GET /api/members` `GET/PATCH /api/members/me` | 로그인 | Directory / 내 정보 (본인 편집 필드만) |
| `POST /api/requests` | 로그인 | 수정 요청 접수 |
| `POST /api/upload-url` | 로그인 | presigned PUT (members: 누구나, news: admin·manager, classmaterial: admin) |
| `/api/papers` `/api/patents` `/api/news` | admin·manager | 콘텐츠 CRUD |
| `/api/semesters` `/api/courses` `/api/classmaterials` | admin | 강의자료 |
| `/api/admin/users` `/api/admin/members` `/api/admin/interns` `/api/admin/vacations` | admin | 계정·멤버·인턴·휴가 |
| `GET/PATCH /api/requests` `/api/talks` | admin | 수정 요청 처리 / 학술발표 |

## 환경변수 (`.env.local`, Vercel)

```
NEXT_PUBLIC_SUPABASE_URL  NEXT_PUBLIC_SUPABASE_ANON_KEY  SUPABASE_SERVICE_ROLE_KEY
R2_ACCESS_KEY_ID  R2_SECRET_ACCESS_KEY  R2_ENDPOINT  R2_BUCKET_NAME  R2_PUBLIC_URL
JWT_SECRET            세션/중간 토큰 서명 (32자 이상 랜덤)
```

## 개발

```bash
npm install
npm run dev        # http://localhost:3000
npm run lint
npm run build
```

배포는 `main` 브랜치 push → Vercel 자동. DB 백업은 `node scripts/backup-db.mjs` → `backups/` (git 제외, 별도 보관). 스키마 변경은 Supabase SQL Editor 에서 실행 후 `supabase/NNN_*.sql` 로 기록.

## 보안 메모

- CSP·보안 헤더는 `src/proxy.js`. 외부 도메인 추가 시 `connect-src`/`img-src` 갱신.
- `supabaseAdmin`(service_role) 은 서버 파일에서만 import. 클라이언트 컴포넌트에 넣지 말 것.
- 논문 제목/저자 등 HTML 허용 필드는 `sanitizeHtml()` 을 거쳐 렌더링 (b/i/u/sub/sup/br 만).
