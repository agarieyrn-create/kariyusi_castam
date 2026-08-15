-- 1. 拡張機能の作成
create extension if not exists pgcrypto;

-- 2. テーブル定義

-- 法人テーブル
create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- ユーザーテーブル
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id),
  name text,
  email text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- ヒアリングセッションテーブル
create table if not exists design_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  scene text not null,
  mood text not null,
  color text not null,
  motif text,
  quantity integer,
  status text not null default 'draft' check (status in ('draft', 'generating', 'completed', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- 柄マスタテーブル
create table if not exists patterns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  motif_tags text[] not null default '{}',
  style_tags text[] not null default '{}',
  scenes text[] not null default '{}',
  okinawa_score integer not null default 3 check (okinawa_score between 1 and 5),
  formal_score integer not null default 3 check (formal_score between 1 and 5),
  bold_score integer not null default 3 check (bold_score between 1 and 5),
  manufacturable boolean not null default true,
  rights_status text not null default 'owned',
  asset_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- 配色マスタテーブル
create table if not exists palettes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color_key text not null unique,
  base_color text not null,
  accent_color text not null,
  sub_color text not null,
  dark_color text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- シャツ型マスタテーブル
create table if not exists garments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  formality integer not null default 3 check (formality between 1 and 5),
  model_asset_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- ロゴ配置テンプレートテーブル
create table if not exists logo_layouts (
  id uuid primary key default gen_random_uuid(),
  layout_key text not null unique,
  name text not null,
  position_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- 生成デザイン（提案内容）テーブル
create table if not exists generated_designs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references design_sessions(id) on delete cascade,
  lane text not null,
  title text not null,
  concept text not null,
  pattern_id uuid references patterns(id),
  palette_id uuid references palettes(id),
  garment_id uuid references garments(id),
  logo_layout_id uuid references logo_layouts(id),
  density integer not null default 48,
  scale_percent integer not null default 100,
  fabric_json text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- 見積テーブル
create table if not exists estimates (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references design_sessions(id) on delete cascade,
  generated_design_id uuid references generated_designs(id) on delete cascade,
  quantity integer not null,
  unit_price integer not null,
  total_price integer not null,
  currency text not null default 'JPY',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- お問い合わせテーブル
create table if not exists inquiries (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references design_sessions(id) on delete cascade,
  generated_design_id uuid references generated_designs(id) on delete cascade,
  customer_name text not null,
  customer_email text not null,
  note text,
  status text not null default 'new' check (status in ('new', 'contacted', 'resolved', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- 3. インデックス定義
create index if not exists idx_users_email on users(email) where deleted_at is null;
create index if not exists idx_design_sessions_user_id on design_sessions(user_id) where deleted_at is null;
create index if not exists idx_generated_designs_session_id on generated_designs(session_id) where deleted_at is null;
create index if not exists idx_estimates_session_id on estimates(session_id) where deleted_at is null;
create index if not exists idx_inquiries_session_id on inquiries(session_id) where deleted_at is null;

-- 4. RLS: owner or a server-signed anonymous session only.
-- The session_id claim is set by the trusted server after issuing a signed token.
create schema if not exists app;
create or replace function app.current_session_id() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'session_id', '')::uuid
$$;

alter table design_sessions enable row level security;
alter table generated_designs enable row level security;
alter table estimates enable row level security;
alter table inquiries enable row level security;

drop policy if exists "Allow insert for signed session" on design_sessions;
drop policy if exists "Allow select for own sessions" on design_sessions;
drop policy if exists "Allow select for anonymous on designs" on generated_designs;
drop policy if exists "Allow insert/select for estimates" on estimates;
drop policy if exists "Allow insert for inquiries" on inquiries;

create policy "signed session may create its session" on design_sessions for insert to anon with check (id = app.current_session_id());
create policy "owner or signed session may read sessions" on design_sessions for select using (user_id = auth.uid() or id = app.current_session_id());
create policy "owner or signed session may read designs" on generated_designs for select using (exists (select 1 from design_sessions s where s.id = generated_designs.session_id and (s.user_id = auth.uid() or s.id = app.current_session_id())));
create policy "signed session may write estimates" on estimates for insert to anon with check (session_id = app.current_session_id());
create policy "owner or signed session may read estimates" on estimates for select using (session_id = app.current_session_id() or exists (select 1 from design_sessions s where s.id = estimates.session_id and s.user_id = auth.uid()));
create policy "signed session may create inquiry" on inquiries for insert to anon with check (session_id = app.current_session_id());
create policy "owner or signed session may read inquiries" on inquiries for select using (session_id = app.current_session_id() or exists (select 1 from design_sessions s where s.id = inquiries.session_id and s.user_id = auth.uid()));
