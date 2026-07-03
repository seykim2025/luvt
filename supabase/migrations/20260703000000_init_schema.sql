-- 사용자 프로필 (auth.users 확장)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  phone text,
  ntrp text,
  role text not null default 'member' check (role in ('member', 'admin')),
  created_at timestamptz not null default now()
);

-- 주차별 대회
create table tournaments (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  event_date date not null,
  capacity int,
  signup_open boolean not null default true,
  created_at timestamptz not null default now()
);
create unique index tournaments_event_date_idx on tournaments(event_date);

-- 사전 참가 신청
create table signups (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (tournament_id, user_id)
);

-- 당일 참가 기록
create table participations (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  checked_in_at timestamptz not null default now(),
  unique (tournament_id, user_id)
);

-- 혜택 규칙
create table benefit_rules (
  id uuid primary key default gen_random_uuid(),
  threshold int not null unique,
  reward text not null,
  active boolean not null default true
);

-- 혜택 지급/사용 기록
create table benefit_redemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  rule_id uuid not null references benefit_rules(id),
  earned_at timestamptz not null default now(),
  redeemed_at timestamptz,
  redeemed_by uuid references profiles(id),
  unique (user_id, rule_id)
);

-- 파트너 찾기 게시글
create table partner_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  tournament_id uuid references tournaments(id) on delete set null,
  message text not null,
  contact text,
  status text not null default 'open' check (status in ('open', 'matched', 'closed')),
  created_at timestamptz not null default now()
);

-- is_admin() 헬퍼 함수
create or replace function public.is_admin()
returns boolean language sql security definer set search_path = public as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- check_in_today RPC
create or replace function check_in_today()
returns json language plpgsql security definer set search_path = public as $$
declare
  v_user_id uuid;
  v_tournament tournaments%rowtype;
  v_total int;
  v_new_rewards text[] := '{}';
  v_br record;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    return json_build_object('ok', false, 'error', '로그인이 필요합니다.');
  end if;

  -- 오늘 날짜의 대회 찾기
  select * into v_tournament from tournaments where event_date = current_date;
  if not found then
    return json_build_object('ok', false, 'error', '오늘 진행 중인 대회가 없습니다.');
  end if;

  -- 참가 기록 (unique 제약으로 중복 자동 차단)
  begin
    insert into participations (tournament_id, user_id)
    values (v_tournament.id, v_user_id);
  exception when unique_violation then
    return json_build_object('ok', false, 'error', '이미 참가 처리되었습니다.');
  end;

  -- 누적 계산
  select count(*) into v_total from participations where user_id = v_user_id;

  -- 새로 달성한 혜택 지급
  for v_br in
    select br.id, br.reward
    from benefit_rules br
    where br.active and br.threshold <= v_total
      and not exists (
        select 1 from benefit_redemptions r
        where r.user_id = v_user_id and r.rule_id = br.id
      )
  loop
    insert into benefit_redemptions (user_id, rule_id)
    values (v_user_id, v_br.id);
    v_new_rewards := array_append(v_new_rewards, v_br.reward);
  end loop;

  return json_build_object('ok', true, 'total', v_total, 'new_rewards', v_new_rewards);
end $$;

-- RLS 정책 설정
alter table profiles enable row level security;
alter table tournaments enable row level security;
alter table signups enable row level security;
alter table participations enable row level security;
alter table benefit_rules enable row level security;
alter table benefit_redemptions enable row level security;
alter table partner_posts enable row level security;

-- profiles: 본인 row만 select/update. 관리자는 전체 select.
create policy "Users can view their own profile" on profiles for select using (auth.uid() = id or is_admin());
create policy "Users can update their own profile" on profiles for update using (auth.uid() = id);
create policy "Users can insert their own profile" on profiles for insert with check (auth.uid() = id);

-- tournaments: 전체 공개 select, 쓰기는 admin만.
create policy "Tournaments are viewable by everyone" on tournaments for select using (true);
create policy "Tournaments are insertable by admin" on tournaments for insert with check (is_admin());
create policy "Tournaments are updatable by admin" on tournaments for update using (is_admin());

-- signups: 본인 것만 select.
create policy "Users can view their own signups" on signups for select using (auth.uid() = user_id or is_admin());
create policy "Users can insert their own signups" on signups for insert with check (auth.uid() = user_id);
create policy "Users can delete their own signups" on signups for delete using (auth.uid() = user_id);

-- participations: 본인 것만 select. (insert는 RPC에서 security definer로 수행되지만 클라이언트 직접 insert 차단)
create policy "Users can view their own participations" on participations for select using (auth.uid() = user_id or is_admin());

-- benefit_rules: 전체 공개 select, 쓰기는 admin만.
create policy "Benefit rules are viewable by everyone" on benefit_rules for select using (true);
create policy "Benefit rules are insertable by admin" on benefit_rules for insert with check (is_admin());
create policy "Benefit rules are updatable by admin" on benefit_rules for update using (is_admin());

-- benefit_redemptions: 본인 것만 select. (insert는 RPC)
create policy "Users can view their own redemptions" on benefit_redemptions for select using (auth.uid() = user_id or is_admin());
create policy "Admin can update redemptions" on benefit_redemptions for update using (is_admin());

-- partner_posts: 로그인 유저 전체 select, 본인 글만 insert/update.
create policy "Posts viewable by logged in users" on partner_posts for select using (auth.uid() is not null);
create policy "Users can insert own post" on partner_posts for insert with check (auth.uid() = user_id);
create policy "Users can update own post" on partner_posts for update using (auth.uid() = user_id or is_admin());
create policy "Users can delete own post" on partner_posts for delete using (auth.uid() = user_id or is_admin());
