# CLAUDE.md — LUV.T (럽티) 대회 멤버십 사이트

## 1. 프로젝트 정의
LUV.T는 매주 진행되는 테니스 대회의 참가자 멤버십 웹사이트다.
- 핵심 가치: 참가자가 대회 당일 버튼 한 번만 누르면 출석·스탬프·혜택·기록이 전부 자동으로 쌓인다.
- 앱이 아니라 모바일 우선 웹사이트 (반응형, 폰 화면 기준으로 먼저 디자인)
- 참가자 플로우: 링크 접속 → 로그인 → "오늘 대회 참가하기" 클릭 → 끝
- 관리자 플로우: 참가 기록, 스탬프, 혜택 대상자, 파트너/사전신청 현황을 자동으로 확인

## 2. 기술 스택 (변경 금지)
| 영역 | 선택 |
| --- | --- |
| 프레임워크 | Next.js 14+ (App Router, TypeScript) |
| DB / Auth / RLS | Supabase |
| 스타일 | Tailwind CSS |
| 배포 | Vercel |
| 로그인 | Supabase Auth — 카카오 OAuth 우선, 이메일 매직링크 보조 |

- 상태관리 라이브러리(Redux 등) 도입 금지. 서버 컴포넌트 + Supabase 쿼리로 해결.
- UI 라이브러리는 shadcn/ui까지만 허용.
- DB 변경은 반드시 `supabase/migrations/` 마이그레이션 파일로만 수행. 대시보드에서 직접 수정 금지.

## 3. 코드/작업 규칙
- 모든 UI 텍스트는 한국어.
- 모바일(390px) 기준으로 먼저 만들고 데스크톱은 최소한만 대응.
- 각 마일스톤(M0~M5)은 별도 세션으로 진행. 세션 시작 시 이 문서를 다시 읽을 것.
- 완료 기준(✅)을 만족하기 전에는 다음 마일스톤 기능을 미리 만들지 말 것.
- 커밋 메시지: `M2: 오늘 대회 참가 버튼 구현` 형식.
- 환경변수: `.env.local` — `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`(서버 전용).

## 4. DB 스키마
```sql
-- 사용자 프로필 (auth.users 확장)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  phone text,
  ntrp text,                         -- 실력 등급 (선택 입력)
  role text not null default 'member' check (role in ('member', 'admin')),
  created_at timestamptz not null default now()
);

-- 주차별 대회
create table tournaments (
  id uuid primary key default gen_random_uuid(),
  title text not null,               -- 예: "7월 1주차 LUV.T OPEN"
  event_date date not null,          -- 대회 날짜
  capacity int,                      -- 사전신청 정원 (null이면 무제한)
  signup_open boolean not null default true,
  created_at timestamptz not null default now()
);
create unique index tournaments_event_date_idx on tournaments(event_date);

-- 사전 참가 신청 (이번 주 대회)
create table signups (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (tournament_id, user_id)    -- 중복 신청 방지
);

-- 당일 참가 기록 = 스탬프 원장
create table participations (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  checked_in_at timestamptz not null default now(),
  unique (tournament_id, user_id)    -- 중복 클릭 방지 (한 대회 1회)
);

-- 혜택 규칙 (누적 n회 → 혜택)
create table benefit_rules (
  id uuid primary key default gen_random_uuid(),
  threshold int not null unique,     -- 예: 3, 5, 10
  reward text not null,              -- 예: "음료 1개"
  active boolean not null default true
);

-- 혜택 지급/사용 기록
create table benefit_redemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  rule_id uuid not null references benefit_rules(id),
  earned_at timestamptz not null default now(),
  redeemed_at timestamptz,           -- null이면 미사용
  redeemed_by uuid references profiles(id),  -- 처리한 관리자
  unique (user_id, rule_id)          -- 같은 혜택 중복 지급 방지
);

-- 파트너 찾기 게시글
create table partner_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  tournament_id uuid references tournaments(id) on delete set null,
  message text not null,             -- 예: "일요일 오전 복식 파트너 구해요"
  contact text,                      -- 오픈카톡 링크 등
  status text not null default 'open' check (status in ('open', 'matched', 'closed')),
  created_at timestamptz not null default now()
);
```

### 파생 값 규칙 (테이블에 저장하지 않음)
- 누적 참가 횟수 = `count(participations where user_id = ...)` — 항상 실시간 계산. 별도 카운터 컬럼 금지(정합성 깨짐 방지).
- 혜택 대상 여부 = 누적 횟수 ≥ `benefit_rules.threshold`인데 `benefit_redemptions`에 없는 규칙이 있으면 대상.
- 혜택 자동 지급: "오늘 대회 참가하기" 처리 시 서버에서 누적 횟수 확인 → 새로 달성한 threshold가 있으면 `benefit_redemptions`에 insert.

### 당일 참가 처리 (핵심 트랜잭션)
"오늘 대회 참가하기"는 반드시 Postgres 함수(RPC) 하나로 처리한다:
```sql
create or replace function check_in_today(p_user_id uuid)
returns json language plpgsql security definer as $$
declare
  v_tournament tournaments%rowtype;
  v_total int;
  v_new_rewards text[];
begin
  -- 오늘 날짜의 대회 찾기
  select * into v_tournament from tournaments where event_date = current_date;
  if not found then
    return json_build_object('ok', false, 'error', '오늘 진행 중인 대회가 없습니다.');
  end if;

  -- 참가 기록 (unique 제약으로 중복 자동 차단)
  insert into participations (tournament_id, user_id)
  values (v_tournament.id, p_user_id)
  on conflict do nothing;

  if not found then
    return json_build_object('ok', false, 'error', '이미 참가 처리되었습니다.');
  end if;

  -- 누적 계산
  select count(*) into v_total from participations where user_id = p_user_id;

  -- 새로 달성한 혜택 지급
  insert into benefit_redemptions (user_id, rule_id)
  select p_user_id, br.id
  from benefit_rules br
  where br.active and br.threshold <= v_total
    and not exists (
      select 1 from benefit_redemptions r
      where r.user_id = p_user_id and r.rule_id = br.id
    )
  returning (select reward from benefit_rules where id = rule_id) into v_new_rewards;

  return json_build_object('ok', true, 'total', v_total, 'new_rewards', v_new_rewards);
end $$;
```
*(구현 시 배열 수집 부분은 실제 동작하도록 다듬을 것 — 의도: 참가 insert + 누적 계산 + 혜택 지급을 원자적으로 처리)*

## 5. RLS 정책 원칙
- `profiles`: 본인 row만 select/update. 관리자는 전체 select.
- `participations`, `benefit_redemptions`, `signups`: 본인 것만 select. insert는 RPC(security definer) 경유만 허용, 클라이언트 직접 insert 금지.
- `tournaments`, `benefit_rules`: 전체 공개 select, 쓰기는 admin만.
- `partner_posts`: 로그인 유저 전체 select, 본인 글만 insert/update.
- admin 판별: `profiles.role = 'admin'` 을 확인하는 `is_admin()` 헬퍼 함수 사용.

## 6. 화면 구조
```
/                  홈 — LUV.T OPEN 헤더 + 4개 버튼
                     [이번 주 대회 참가 신청] [오늘 대회 참가하기]
                     [내 스탬프 보기] [파트너 찾기]
/login             카카오 로그인
/onboarding        최초 로그인 시 이름/연락처 입력
/stamps            내 스탬프판 (누적 횟수, 다음 혜택까지 n회, 받은 혜택 목록)
/signup            이번 주 대회 사전 신청 (정원/마감 표시)
/partners          파트너 찾기 게시판
/admin             관리자 — 오늘 참가자 명단, 혜택 대상자, 혜택 사용 처리
/admin/tournaments 주차별 대회 생성/관리
```
- "오늘 대회 참가하기" 버튼은 오늘 날짜 대회가 있을 때만 활성화. 이미 참가했으면 "참가 완료 ✓" 상태로 표시.
- 스탬프판은 10칸 그리드 시각화(채워진 칸/빈 칸), 혜택 달성 칸에 아이콘 표시.

## 7. 마일스톤 (세션 단위)
| 단계 | 내용 | 완료 기준 |
| --- | --- | --- |
| M0 | 프로젝트 세팅, Supabase 연결, Vercel 배포 | 빈 앱 프리뷰 배포 |
| M1 | Auth(카카오) + 스키마 마이그레이션 + RLS | 로그인 후 프로필 저장·조회 |
| M2 | 홈 + "오늘 대회 참가하기" + 내 스탬프 | 실제 폰에서 1클릭 적립 (MVP) |
| M3 | 혜택 규칙 + 관리자 페이지 | 관리자 폰으로 명단·혜택 처리 |
| M4 | 사전 신청 + 파트너 찾기 | 정원 마감 동작, 게시글 등록 |
| M5 | 도메인, OG/카톡 공유, QA | 실사용 배포 |

## 8. 하지 말 것
- 결제 기능 (1단계 범위 아님)
- 랭킹/대진표 (추후 확장)
- 네이티브 앱 대응, PWA 푸시 알림
- 누적 횟수 캐시 컬럼, 트리거 남용
- M2 완료 전 M3+ 기능 선행 구현
