CLAUDE.md — LUV.T (럽티) 대회 멤버십 사이트

1. 프로젝트 정의
LUV.T는 매주 진행되는 테니스 대회의 참가자 멤버십 웹 플랫폼이다.
> 참가자가 대회에 참가할수록 기록이 쌓이고, 스탬프와 혜택이 자동 지급되며,
> 파트너 매칭과 커뮤니티 기능까지 연결되는 모바일 웹 플랫폼.
핵심 버튼은 하나: "오늘 대회 참가하기"
이 버튼을 중심으로 참가 기록 → 스탬프 → 혜택 → 대회 성적 → 명예의 전당이 자동 연결된다.
앱이 아니라 모바일 우선 웹사이트 + 관리자 페이지
스탬프 적립 방식: 참가자 버튼 클릭 + 관리자 최종 승인 (하이브리드)
개발 순서는 §8의 1차 → 2차 → 3차를 엄격히 지킨다. 다음 차수 기능을 미리 만들지 말 것.

2. 기술 스택 (변경 금지)
영역	선택
프론트	Next.js 14+ (App Router, TypeScript)
DB / Auth / RLS	Supabase
스타일	Tailwind CSS (+ shadcn/ui까지만 허용)
배포	Vercel
로그인	Supabase Auth — 카카오 OAuth 우선, 전화번호 본인확인 병행
알림 (3차)	카카오 알림톡 또는 문자 연동
도메인	luvt.kr 또는 luvtopen.com (M5에서 연결)
상태관리 라이브러리(Redux 등) 금지. 서버 컴포넌트 + Supabase 쿼리로 해결.
DB 변경은 반드시 `supabase/migrations/` 파일로만. 대시보드 직접 수정 금지.

3. 코드/작업 규칙
모든 UI 텍스트는 한국어.
모바일(390px) 기준 우선. 관리자 페이지만 태블릿/데스크톱 대응.
마일스톤 = 세션 단위. 세션 시작 시 이 문서를 다시 읽고 해당 마일스톤 범위만 작업.
커밋 메시지: `M2: 오늘 대회 참가 버튼 구현` 형식.
환경변수: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`(서버 전용).

4. DB 스키마
```sql
-- ===== 회원 =====

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,                -- 실명
  gender text check (gender in ('M', 'F')),
  phone text unique,                 -- 로그인/본인확인
  birth_ym text,                     -- 출생연월 'YYYY-MM' (연령대 구분용)
  region text,                       -- 주 활동 지역
  tennis_started_on date,            -- 테니스 시작일 (구력 계산)
  dominant_hand text check (dominant_hand in ('L', 'R')),
  role text not null default 'member' check (role in ('member', 'admin')),
  created_at timestamptz not null default now()
);

-- 커스텀 필드: 관리자가 항목(NTRP, 클럽명, 혼복 가능 여부 등)을 추가 가능
create table profile_field_defs (
  id uuid primary key default gen_random_uuid(),
  label text not null,               -- 예: "NTRP", "라켓 브랜드"
  field_type text not null default 'text' check (field_type in ('text', 'number', 'select', 'boolean')),
  options jsonb,                     -- select일 때 선택지
  required boolean not null default false,
  sort_order int not null default 0,
  active boolean not null default true
);

create table profile_field_values (
  user_id uuid not null references profiles(id) on delete cascade,
  field_id uuid not null references profile_field_defs(id) on delete cascade,
  value text,
  primary key (user_id, field_id)
);

-- ===== 대회 =====

create table tournaments (
  id uuid primary key default gen_random_uuid(),
  title text not null,               -- 예: "LUV.T OPEN"
  event_date date not null,
  status text not null default 'draft' check (status in ('draft', 'open', 'ongoing', 'done')),
  created_at timestamptz not null default now()
);
create unique index tournaments_event_date_idx on tournaments(event_date);

-- 부서 (입문 / 브론즈 / 혼복 / 남복 등)
create table divisions (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments(id) on delete cascade,
  name text not null,                -- 예: "브론즈", "혼복"
  team_count int,                    -- 참가팀수
  unique (tournament_id, name)
);

-- ===== 참가 기록 = 스탬프 원장 =====

create table participations (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments(id) on delete cascade,
  division_id uuid references divisions(id) on delete set null,
  user_id uuid not null references profiles(id) on delete cascade,
  source text not null default 'self' check (source in ('self', 'admin')),  -- 등록 주체
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  partner_name text,                 -- 복식 파트너 (프로필 연동은 3차)
  final_result text,                 -- 우승 / 준우승 / 4강 / 예선탈락 (2차)
  scores jsonb,                      -- 경기별 스코어 [{"round":"예선1","score":"6:4"}] (3차)
  checked_in_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid references profiles(id),
  unique (tournament_id, user_id)    -- 한 대회 1회 (중복 클릭 방지)
);
```
스탬프 정책 (중요)
참가자가 "오늘 대회 참가하기" 클릭 → `status='pending'`으로 생성
관리자가 명단에서 일괄 승인 → `status='approved'` (누락자는 관리자가 `source='admin'`으로 직접 추가)
누적 참가 횟수 = `approved` 상태 participations의 count. 별도 카운터 컬럼 금지, 항상 실시간 계산.

```sql
-- ===== 혜택 =====

-- 관리자가 설정: 참가횟수 / 혜택명 / 할인금액 / 사용 가능 기간
create table benefit_rules (
  id uuid primary key default gen_random_uuid(),
  threshold int not null unique,     -- 3, 5, 10, 15, 20, 30
  reward text not null,              -- "음료 제공", "무료 참가권", "VIP 배지"
  discount_amount int,               -- 할인형이면 금액 (예: 5000), 아니면 null
  valid_days int,                    -- 지급 후 사용 가능 기간(일), null이면 무기한
  active boolean not null default true
);

create table benefit_redemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  rule_id uuid not null references benefit_rules(id),
  earned_at timestamptz not null default now(),
  expires_at timestamptz,            -- earned_at + valid_days
  redeemed_at timestamptz,           -- null이면 미사용
  redeemed_by uuid references profiles(id),
  unique (user_id, rule_id)
);
```
혜택 지급 시점: 관리자가 참가를 승인하는 순간 서버에서 누적 횟수 재계산 → 새로 달성한 threshold의 혜택을 자동 insert. (참가자 클릭 시점이 아님 — 승인 전 pending은 미집계)

```sql
-- ===== 커뮤니티 (2차) =====

create table partner_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  tournament_id uuid references tournaments(id) on delete set null,
  message text not null,
  region text,                       -- 지역별 파트너 매칭
  status text not null default 'open' check (status in ('open', 'matched', 'closed')),
  created_at timestamptz not null default now()
);

create table inquiries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  category text not null default 'general' check (category in ('general', 'report')),  -- 문의/제보
  content text not null,
  reply text,
  replied_at timestamptz,
  created_at timestamptz not null default now()
);

create table notices (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  target text not null default 'all' check (target in ('all', 'selected')),
  target_user_ids uuid[],            -- 선택 공지일 때
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- 명예의 전당 (자동/수동 등록)
create table hall_of_fame (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid references tournaments(id) on delete cascade,
  category text not null check (category in ('champion', 'most_participation', 'best_dresser')),
  user_id uuid not null references profiles(id) on delete cascade,
  note text,
  created_at timestamptz not null default now()
);

-- ===== 쪽지 (3차) =====

create table messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references profiles(id) on delete cascade,
  receiver_id uuid not null references profiles(id) on delete cascade,
  content text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
```

5. RLS 정책 원칙
`profiles`: 본인 select/update. 관리자 전체 select/update.
`profile_field_defs`: 전체 select, 쓰기 admin만. `profile_field_values`: 본인 것만.
`participations`: 본인 select. insert는 RPC(security definer) 경유만, 승인/수정은 admin만.
`benefit_rules`: 전체 select, 쓰기 admin. `benefit_redemptions`: 본인 select, 쓰기는 서버만.
`tournaments`, `divisions`, `notices`, `hall_of_fame`: 전체 select, 쓰기 admin.
`partner_posts`: 로그인 유저 전체 select, 본인 글 insert/update, admin은 전체 관리.
`inquiries`: 본인 것 + admin 전체.
`messages`: sender 또는 receiver인 row만.
admin 판별은 `is_admin()` 헬퍼 함수로 통일.

6. 화면 구조
참가자 (모바일)
```
/                  홈 — "오늘 대회 참가하기" 대형 버튼 + 주요 메뉴
/login             카카오 로그인 → /onboarding (최초 1회, 필수 프로필 입력)
/me                내 프로필 (기본 + 커스텀 필드)
/me/records        내 참가 기록 — 대회 이력, 스탬프판, 결과
/me/benefits       내 혜택 — 누적 혜택, 할인권, 사용/만료 상태
/partners          파트너 찾아요 게시판 (2차)
/messages          쪽지함 (3차)
/hall-of-fame      명예의 전당 (2차)
/inquiry           문의하기 (2차)
/notices           공지 (2차)
```

관리자 (/admin, 태블릿 대응)
```
/admin             대시보드 — 오늘 대회 참가 현황
/admin/members     회원 관리 (조회/수정, 커스텀 필드 정의)
/admin/tournaments 대회 관리 (생성, 부서 설정)
/admin/checkins    참가 기록 등록 — pending 일괄 승인, 누락자 수동 추가
/admin/results     경기 결과 관리 (2차: 최종 결과 / 3차: 스코어)
/admin/benefits    혜택 관리 (규칙 설정) + 사용 처리
/admin/notices     공지 관리 (2차)
/admin/boards      게시판 관리 — 파트너 글, 문의, 제보 (2차)
```
"오늘 대회 참가하기": 오늘 날짜 `status='open'|'ongoing'` 대회가 있을 때만 활성화. 클릭 후 "참가 접수됨 (관리자 확인 대기)" → 승인되면 "참가 완료 ✓ 스탬프 +1".
스탬프판: 10칸 그리드, 혜택 threshold 칸에 아이콘.

7. 핵심 트랜잭션
참가자 체크인은 RPC 하나로:
```
check_in_today(user_id) →
  오늘 대회 확인 → participations insert (pending) → 접수 결과 반환
```
관리자 승인은 RPC 하나로 (혜택 지급 포함, 원자적):
```
approve_participations(participation_ids[]) →
  status='approved' 업데이트
  → 각 유저 누적 횟수 재계산
  → 새로 달성한 benefit_rules에 대해 benefit_redemptions insert (expires_at 계산)
  → 승인/지급 결과 반환
```

8. 마일스톤
1차 오픈 (필수) — M0~M4
단계	내용	완료 기준
M0	세팅: 레포, Supabase, Vercel 프리뷰	빈 앱 배포
M1	Auth(카카오) + 전체 스키마 마이그레이션 + RLS + 온보딩	로그인 → 프로필 저장
M2	홈 + "오늘 대회 참가하기"(pending) + 내 참가 기록/스탬프판	폰에서 1클릭 접수
M3	관리자: 대회/부서 생성, 참가 승인(일괄), 누락자 추가, 회원 관리, 커스텀 필드	승인 → 스탬프 확정 흐름 완성
M4	혜택: 규칙 설정, 승인 시 자동 지급, 내 혜택 화면, 사용 처리	3회 참가 시 음료 혜택 자동 지급 확인 — 1차 오픈

2차 추가 — M5~M7
단계	내용
M5	파트너 찾아요 게시판 + 문의/제보
M6	공지(전체/선택) + 명예의 전당 + 경기 최종 결과 입력
M7	도메인 연결, OG/카톡 공유, QA — 2차 오픈

3차 추가 — M8+
쪽지, 할인권 자동 발급 고도화, 경기별 스코어 상세, 랭킹/포인트, 카카오 알림톡.

9. 하지 말 것
결제 기능, 네이티브 앱, PWA 푸시
실시간 채팅 (쪽지로 충분, 그마저 3차)
누적 횟수 캐시 컬럼, 트리거 남용
현재 차수 완료 기준 미달성 상태에서 다음 차수 기능 선행 구현
커스텀 필드를 profiles에 컬럼 추가로 처리하는 것 (반드시 field_defs/values 구조 사용)
