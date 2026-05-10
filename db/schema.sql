create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id),
  name text,
  email text,
  created_at timestamptz not null default now()
);

create table if not exists design_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  scene text not null,
  mood text not null,
  color text not null,
  motif text,
  quantity integer,
  status text not null default 'created',
  created_at timestamptz not null default now()
);

create table if not exists patterns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  motif_tags text[] not null default '{}',
  style_tags text[] not null default '{}',
  scenes text[] not null default '{}',
  okinawa_score integer not null default 3,
  formal_score integer not null default 3,
  manufacturable boolean not null default true,
  rights_status text not null default 'owned',
  asset_path text,
  created_at timestamptz not null default now()
);

create table if not exists palettes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color_key text not null unique,
  base_color text not null,
  accent_color text not null,
  sub_color text not null,
  dark_color text not null,
  created_at timestamptz not null default now()
);

create table if not exists garments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  formality integer not null default 3,
  model_asset_path text,
  created_at timestamptz not null default now()
);

create table if not exists logo_layouts (
  id text primary key,
  name text not null,
  position_data jsonb not null default '{}'::jsonb
);

create table if not exists generated_designs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references design_sessions(id) on delete cascade,
  lane text not null,
  title text not null,
  concept text not null,
  pattern_id uuid references patterns(id),
  palette_id uuid references palettes(id),
  garment_id uuid references garments(id),
  logo_layout_id text references logo_layouts(id),
  density integer not null default 48,
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists estimates (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references design_sessions(id),
  generated_design_id uuid references generated_designs(id),
  quantity integer not null,
  unit_price integer not null,
  total_price integer not null,
  currency text not null default 'JPY',
  created_at timestamptz not null default now()
);

create table if not exists inquiries (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references design_sessions(id),
  generated_design_id uuid references generated_designs(id),
  customer_name text not null,
  customer_email text not null,
  note text,
  status text not null default 'new',
  created_at timestamptz not null default now()
);
