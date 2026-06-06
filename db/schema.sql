-- 1. 拡張機能の作成
create extension if not exists "uuid-ossp";

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

-- 4. RLS (Row Level Security) 定義

alter table design_sessions enable row level security;
alter table generated_designs enable row level security;
alter table estimates enable row level security;
alter table inquiries enable row level security;

-- 基本的な匿名アクセス権限ポリシー（サンプル。本番運用に合わせて調整）
create policy "Allow insert for anonymous users on sessions"
  on design_sessions for insert to anon with check (true);

create policy "Allow select for own sessions"
  on design_sessions for select to anon using (true); -- 実際は session_id による制限を推奨

create policy "Allow select for anonymous on designs"
  on generated_designs for select to anon using (true);

create policy "Allow insert/select for estimates"
  on estimates for all to anon using (true);

create policy "Allow insert for inquiries"
  on inquiries for insert to anon with check (true);
