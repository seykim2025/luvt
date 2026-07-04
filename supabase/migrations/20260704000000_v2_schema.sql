-- 기존 테이블 초기화 (v1 -> v2 마이그레이션)
drop table if exists public.messages cascade;
drop table if exists public.hall_of_fame cascade;
drop table if exists public.notices cascade;
drop table if exists public.inquiries cascade;
drop table if exists public.partner_posts cascade;
drop table if exists public.benefit_redemptions cascade;
drop table if exists public.benefit_rules cascade;
drop table if exists public.participations cascade;
drop table if exists public.signups cascade;
drop table if exists public.divisions cascade;
drop table if exists public.tournaments cascade;
drop table if exists public.profile_field_values cascade;
drop table if exists public.profile_field_defs cascade;
drop table if exists public.profiles cascade;

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

-- is_admin() 헬퍼 함수
create or replace function public.is_admin()
returns boolean language sql security definer set search_path = public as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- 참가자 체크인은 RPC 하나로: check_in_today(user_id)
create or replace function check_in_today()
returns json language plpgsql security definer set search_path = public as $$
declare
  v_user_id uuid;
  v_tournament tournaments%rowtype;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    return json_build_object('ok', false, 'error', '로그인이 필요합니다.');
  end if;

  -- 오늘 날짜의 열린 대회 찾기 (open 또는 ongoing)
  select * into v_tournament from tournaments 
  where event_date = current_date and status in ('open', 'ongoing');
  
  if not found then
    return json_build_object('ok', false, 'error', '오늘 참가 가능한 대회가 없습니다.');
  end if;

  -- 참가 기록 (pending 상태로)
  begin
    insert into participations (tournament_id, user_id, status, source)
    values (v_tournament.id, v_user_id, 'pending', 'self');
  exception when unique_violation then
    return json_build_object('ok', false, 'error', '이미 참가 신청이 접수되었습니다.');
  end;

  return json_build_object('ok', true, 'message', '참가 접수됨 (관리자 확인 대기)');
end $$;

-- 관리자 승인은 RPC 하나로 (혜택 지급 포함, 원자적): approve_participations(participation_ids[])
create or replace function approve_participations(p_ids uuid[])
returns json language plpgsql security definer set search_path = public as $$
declare
  v_pid uuid;
  v_user_id uuid;
  v_total int;
  v_br record;
  v_admin_id uuid;
begin
  v_admin_id := auth.uid();
  if not is_admin() then
    return json_build_object('ok', false, 'error', '관리자 권한이 필요합니다.');
  end if;

  foreach v_pid in array p_ids
  loop
    -- 승인 상태로 업데이트
    update participations
    set status = 'approved', approved_at = now(), approved_by = v_admin_id
    where id = v_pid and status = 'pending'
    returning user_id into v_user_id;

    if v_user_id is not null then
      -- 누적 횟수 재계산 (승인된 것만)
      select count(*) into v_total from participations 
      where user_id = v_user_id and status = 'approved';

      -- 새로 달성한 threshold의 혜택을 자동 insert
      for v_br in
        select br.id, br.valid_days
        from benefit_rules br
        where br.active and br.threshold <= v_total
          and not exists (
            select 1 from benefit_redemptions r
            where r.user_id = v_user_id and r.rule_id = br.id
          )
      loop
        insert into benefit_redemptions (user_id, rule_id, expires_at)
        values (
          v_user_id, 
          v_br.id, 
          case when v_br.valid_days is not null then now() + (v_br.valid_days || ' days')::interval else null end
        );
      end loop;
    end if;
  end loop;

  return json_build_object('ok', true, 'message', '일괄 승인 및 혜택 지급이 완료되었습니다.');
end $$;

-- RLS 정책 설정
alter table profiles enable row level security;
alter table profile_field_defs enable row level security;
alter table profile_field_values enable row level security;
alter table tournaments enable row level security;
alter table divisions enable row level security;
alter table participations enable row level security;
alter table benefit_rules enable row level security;
alter table benefit_redemptions enable row level security;
alter table partner_posts enable row level security;
alter table inquiries enable row level security;
alter table notices enable row level security;
alter table hall_of_fame enable row level security;
alter table messages enable row level security;

-- profiles: 본인 select/update. 관리자 전체 select/update.
create policy "Users can view their own profile" on profiles for select using (auth.uid() = id or is_admin());
create policy "Users can update their own profile" on profiles for update using (auth.uid() = id or is_admin());
create policy "Users can insert their own profile" on profiles for insert with check (auth.uid() = id);

-- profile_field_defs: 전체 select, 쓰기 admin만.
create policy "profile_field_defs select" on profile_field_defs for select using (true);
create policy "profile_field_defs all admin" on profile_field_defs for all using (is_admin());

-- profile_field_values: 본인 것만. (관리자는 모든 것 조회/수정 가능해야 함)
create policy "profile_field_values select" on profile_field_values for select using (auth.uid() = user_id or is_admin());
create policy "profile_field_values update" on profile_field_values for update using (auth.uid() = user_id or is_admin());
create policy "profile_field_values insert" on profile_field_values for insert with check (auth.uid() = user_id or is_admin());
create policy "profile_field_values delete" on profile_field_values for delete using (auth.uid() = user_id or is_admin());

-- tournaments: 전체 select, 쓰기 admin.
create policy "tournaments select" on tournaments for select using (true);
create policy "tournaments all admin" on tournaments for all using (is_admin());

-- divisions: 전체 select, 쓰기 admin.
create policy "divisions select" on divisions for select using (true);
create policy "divisions all admin" on divisions for all using (is_admin());

-- participations: 본인 select. insert는 RPC(security definer) 경유만, 승인/수정은 admin만.
create policy "participations select" on participations for select using (auth.uid() = user_id or is_admin());
create policy "participations admin all" on participations for all using (is_admin());

-- benefit_rules: 전체 select, 쓰기 admin.
create policy "benefit_rules select" on benefit_rules for select using (true);
create policy "benefit_rules all admin" on benefit_rules for all using (is_admin());

-- benefit_redemptions: 본인 select, 쓰기는 서버만(RPC 및 관리자).
create policy "benefit_redemptions select" on benefit_redemptions for select using (auth.uid() = user_id or is_admin());
create policy "benefit_redemptions admin all" on benefit_redemptions for all using (is_admin());

-- partner_posts: 로그인 유저 전체 select, 본인 글 insert/update, admin은 전체 관리.
create policy "partner_posts select" on partner_posts for select using (auth.uid() is not null);
create policy "partner_posts insert" on partner_posts for insert with check (auth.uid() = user_id);
create policy "partner_posts update" on partner_posts for update using (auth.uid() = user_id or is_admin());
create policy "partner_posts delete" on partner_posts for delete using (auth.uid() = user_id or is_admin());

-- inquiries: 본인 것 + admin 전체.
create policy "inquiries select" on inquiries for select using (auth.uid() = user_id or is_admin());
create policy "inquiries insert" on inquiries for insert with check (auth.uid() = user_id);
create policy "inquiries update" on inquiries for update using (auth.uid() = user_id or is_admin());
create policy "inquiries delete" on inquiries for delete using (auth.uid() = user_id or is_admin());

-- notices: 전체 select, 쓰기 admin.
create policy "notices select" on notices for select using (true);
create policy "notices all admin" on notices for all using (is_admin());

-- hall_of_fame: 전체 select, 쓰기 admin.
create policy "hall_of_fame select" on hall_of_fame for select using (true);
create policy "hall_of_fame all admin" on hall_of_fame for all using (is_admin());

-- messages: sender 또는 receiver인 row만.
create policy "messages select" on messages for select using (auth.uid() = sender_id or auth.uid() = receiver_id or is_admin());
create policy "messages insert" on messages for insert with check (auth.uid() = sender_id or is_admin());
create policy "messages update" on messages for update using (auth.uid() = sender_id or auth.uid() = receiver_id or is_admin());
create policy "messages delete" on messages for delete using (auth.uid() = sender_id or auth.uid() = receiver_id or is_admin());
