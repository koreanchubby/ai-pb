-- AI PB 데이터베이스 스키마 (Supabase / PostgreSQL)
-- 기준: docs/DB_DESIGN.md ERD (이슈 #20, 마일스톤 5)
-- 적용 방법: Supabase 대시보드 → SQL Editor → 이 파일 전체를 붙여 넣고 Run. 여러 번 실행해도 안전합니다(if not exists).
--
-- 접근 원칙
--   · 앱은 로그인 없이 쓰므로, 브라우저마다 Supabase "익명 로그인"으로 고유 사용자(auth.uid())를 받습니다.
--   · 고객 데이터(client 이하)는 만든 사용자 본인만 읽고 쓸 수 있습니다(RLS). 다른 브라우저에서는 보이지 않습니다.
--   · 하우스뷰·근거(house_view, evidence)는 누구나 읽기만 가능. 쓰기는 대시보드(관리자)에서만.
--   · 이름·주민번호·계좌번호 같은 개인 식별정보는 저장하지 않습니다.
--   · 금액 단위: 자산 억원(numeric), 생활비·연금 만원.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- 고객
create table if not exists public.client (
  id            uuid primary key default gen_random_uuid(),
  owner         uuid not null unique default auth.uid(),   -- 익명 로그인 사용자 1명 = 고객 1명
  age           int  check (age between 18 and 100),
  employment    text check (employment in ('근로소득자', '사업자', '은퇴 예정', '은퇴')),
  risk_profile  int  check (risk_profile between 1 and 5), -- 설문으로 산출된 성향(1 안정형 ~ 5 공격투자형)
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- 설문 원응답: 점수가 아니라 고른 선택지 번호를 남깁니다(채점표가 바뀌어도 다시 계산 가능)
create table if not exists public.survey_answer (
  client_id     uuid not null references public.client(id) on delete cascade,
  question_no   int  not null check (question_no between 1 and 10),
  option_index  int  not null check (option_index >= 0),
  answered_at   timestamptz not null default now(),
  primary key (client_id, question_no)
);

create table if not exists public.family_member (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references public.client(id) on delete cascade,
  relation   text not null check (relation in ('spouse', 'child')),
  order_no   int  not null check (order_no >= 1),
  unique (client_id, relation, order_no)
);

create table if not exists public.goal (
  client_id              uuid primary key references public.client(id) on delete cascade,
  goal_type              text not null check (goal_type in ('general', 'retirement', 'transfer', 'both')),
  retirement_in_years    int     check (retirement_in_years >= 0),
  monthly_spend_manwon   numeric check (monthly_spend_manwon >= 0),
  pension_manwon         numeric check (pension_manwon >= 0),
  updated_at             timestamptz not null default now()
);

create table if not exists public.asset (
  id               uuid primary key default gen_random_uuid(),
  client_id        uuid not null references public.client(id) on delete cascade,
  category         text not null check (category in ('realestate', 'kretf', 'globaletf', 'govbond', 'corpbond', 'pef', 'alternative', 'cash', 'debt')),
  amount_eok       numeric not null default 0 check (amount_eok >= 0),
  redeemable_year  int  check (redeemable_year between 2000 and 2100),  -- 사모펀드만
  must_hold        bool not null default false,                        -- 거주 부동산·조정 불가 사모펀드
  updated_at       timestamptz not null default now(),
  unique (client_id, category)
);

-- ---------------------------------------------------------------- 승계
create table if not exists public.transfer_plan (
  id                        uuid primary key default gen_random_uuid(),
  client_id                 uuid not null unique references public.client(id) on delete cascade,
  estate_tax_estimate_eok   numeric check (estate_tax_estimate_eok >= 0),
  liquidity_target_eok      numeric check (liquidity_target_eok >= 0),
  funding_mode              text check (funding_mode in ('financial', 'insurance', 'installment')),
  insurance_reserve_eok     numeric check (insurance_reserve_eok >= 0),
  gift_within_5y            bool not null default false,
  updated_at                timestamptz not null default now()
);

create table if not exists public.heir_share (
  plan_id           uuid not null references public.transfer_plan(id) on delete cascade,
  family_member_id  uuid not null references public.family_member(id) on delete cascade,
  desired_pct       numeric check (desired_pct between 0 and 100),
  legal_pct         numeric check (legal_pct between 0 and 100),
  reserve_pct       numeric check (reserve_pct between 0 and 100),   -- 유류분
  primary key (plan_id, family_member_id)
);

create table if not exists public.expert_review (
  id             uuid primary key default gen_random_uuid(),
  plan_id        uuid not null references public.transfer_plan(id) on delete cascade,
  reviewer_type  text not null check (reviewer_type in ('tax', 'lawyer')),
  status         text not null check (status in ('requested', 'in_review', 'approved', 'revision')),
  conditions     text,
  decided_at     timestamptz
);

-- ---------------------------------------------------------------- 공용 참고 데이터 (읽기 전용)
create table if not exists public.house_view (
  id            uuid primary key default gen_random_uuid(),
  as_of         date not null,
  source_label  text not null,     -- 기관명·자료명·발간일
  views         jsonb not null     -- 자산군별 +1 / 0 / -1
);

create table if not exists public.evidence (
  id                 text primary key,  -- data/news.json 의 id
  title              text not null,
  url                text,
  source             text,
  source_type        text check (source_type in ('official', 'market', 'news')),
  published_at       timestamptz,
  collected_at       timestamptz,
  facts              text,
  ai_interpretation  text
);

-- ---------------------------------------------------------------- 추천안 (덮어쓰지 않고 쌓음)
create table if not exists public.recommendation (
  id              uuid primary key default gen_random_uuid(),
  client_id       uuid not null references public.client(id) on delete cascade,
  house_view_id   uuid references public.house_view(id),
  input_version   int  not null default 1,
  use_taa         bool not null default false,
  use_band        bool not null default true,
  target_weights  jsonb not null,   -- 자산군별 목표 금액(억원)
  trades          jsonb,            -- 거래 목록
  created_at      timestamptz not null default now()
);

create index if not exists recommendation_client_created on public.recommendation (client_id, created_at desc);

-- ---------------------------------------------------------------- 테이블 권한 (Data API에 노출)
-- 프로젝트 생성 때 "새 테이블 자동 공개"를 껐으므로, 필요한 권한만 직접 줍니다. 실제 행 접근은 아래 RLS 정책이 다시 걸러냅니다.
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.client, public.survey_answer, public.family_member, public.goal,
  public.asset, public.transfer_plan, public.heir_share, public.expert_review to authenticated;
grant select, insert on public.recommendation to authenticated;
grant select on public.house_view, public.evidence to anon, authenticated;

-- ---------------------------------------------------------------- 접근 규칙 (RLS)
alter table public.client         enable row level security;
alter table public.survey_answer  enable row level security;
alter table public.family_member  enable row level security;
alter table public.goal           enable row level security;
alter table public.asset          enable row level security;
alter table public.transfer_plan  enable row level security;
alter table public.heir_share     enable row level security;
alter table public.expert_review  enable row level security;
alter table public.house_view     enable row level security;
alter table public.evidence       enable row level security;
alter table public.recommendation enable row level security;

-- 내 고객 행인지 확인하는 함수 (정책에서 재사용)
create or replace function public.is_my_client(cid uuid) returns boolean
  language sql stable security definer set search_path = public
  as $$ select exists (select 1 from public.client c where c.id = cid and c.owner = auth.uid()) $$;

create or replace function public.is_my_plan(pid uuid) returns boolean
  language sql stable security definer set search_path = public
  as $$ select exists (select 1 from public.transfer_plan p join public.client c on c.id = p.client_id
                       where p.id = pid and c.owner = auth.uid()) $$;

do $$
declare t text;
begin
  -- 기존 정책을 지우고 다시 만듭니다(여러 번 실행해도 같은 결과)
  for t in select unnest(array['client','survey_answer','family_member','goal','asset','transfer_plan',
                               'heir_share','expert_review','house_view','evidence','recommendation']) loop
    execute format('drop policy if exists own_rows on public.%I', t);
    execute format('drop policy if exists read_all on public.%I', t);
    execute format('drop policy if exists own_insert on public.%I', t);
  end loop;
end $$;

create policy own_rows on public.client
  for all to authenticated using (owner = auth.uid()) with check (owner = auth.uid());

create policy own_rows on public.survey_answer  for all to authenticated using (public.is_my_client(client_id)) with check (public.is_my_client(client_id));
create policy own_rows on public.family_member  for all to authenticated using (public.is_my_client(client_id)) with check (public.is_my_client(client_id));
create policy own_rows on public.goal           for all to authenticated using (public.is_my_client(client_id)) with check (public.is_my_client(client_id));
create policy own_rows on public.asset          for all to authenticated using (public.is_my_client(client_id)) with check (public.is_my_client(client_id));
create policy own_rows on public.transfer_plan  for all to authenticated using (public.is_my_client(client_id)) with check (public.is_my_client(client_id));
create policy own_rows on public.heir_share     for all to authenticated using (public.is_my_plan(plan_id))     with check (public.is_my_plan(plan_id));
create policy own_rows on public.expert_review  for all to authenticated using (public.is_my_plan(plan_id))     with check (public.is_my_plan(plan_id));

-- 추천안은 쌓기만: 읽기·추가만 허용 (수정·삭제 정책 없음)
create policy own_rows on public.recommendation for select to authenticated using (public.is_my_client(client_id));
create policy own_insert on public.recommendation for insert to authenticated with check (public.is_my_client(client_id));

create policy read_all on public.house_view for select to anon, authenticated using (true);
create policy read_all on public.evidence   for select to anon, authenticated using (true);
