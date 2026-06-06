-- Migration: 001_initial.sql
-- Created At: 2026-06-06
-- Description: Initial database schema generation with RLS, check constraints, indexes, and soft delete fields.

BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Tables
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id),
  name text,
  email text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS design_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  scene text NOT NULL,
  mood text NOT NULL,
  color text NOT NULL,
  motif text,
  quantity integer,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'generating', 'completed', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text,
  motif_tags text[] NOT NULL DEFAULT '{}',
  style_tags text[] NOT NULL DEFAULT '{}',
  scenes text[] NOT NULL DEFAULT '{}',
  okinawa_score integer NOT NULL DEFAULT 3 CHECK (okinawa_score BETWEEN 1 AND 5),
  formal_score integer NOT NULL DEFAULT 3 CHECK (formal_score BETWEEN 1 AND 5),
  bold_score integer NOT NULL DEFAULT 3 CHECK (bold_score BETWEEN 1 AND 5),
  manufacturable boolean NOT NULL DEFAULT true,
  rights_status text NOT NULL DEFAULT 'owned',
  asset_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS palettes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color_key text NOT NULL UNIQUE,
  base_color text NOT NULL,
  accent_color text NOT NULL,
  sub_color text NOT NULL,
  dark_color text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS garments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  formality integer NOT NULL DEFAULT 3 CHECK (formality BETWEEN 1 AND 5),
  model_asset_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS logo_layouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  layout_key text NOT NULL UNIQUE,
  name text NOT NULL,
  position_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS generated_designs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES design_sessions(id) ON DELETE CASCADE,
  lane text NOT NULL,
  title text NOT NULL,
  concept text NOT NULL,
  pattern_id uuid REFERENCES patterns(id),
  palette_id uuid REFERENCES palettes(id),
  garment_id uuid REFERENCES garments(id),
  logo_layout_id uuid REFERENCES logo_layouts(id),
  density integer NOT NULL DEFAULT 48,
  scale_percent integer NOT NULL DEFAULT 100,
  fabric_json text,
  tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS estimates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES design_sessions(id) ON DELETE CASCADE,
  generated_design_id uuid REFERENCES generated_designs(id) ON DELETE CASCADE,
  quantity integer NOT NULL,
  unit_price integer NOT NULL,
  total_price integer NOT NULL,
  currency text NOT NULL DEFAULT 'JPY',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES design_sessions(id) ON DELETE CASCADE,
  generated_design_id uuid REFERENCES generated_designs(id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  note text,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'resolved', 'closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

-- 2. Create Indexes
CREATE INDEX IF NOT EXISTS idx_users_email_001 ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_design_sessions_user_id_001 ON design_sessions(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_generated_designs_session_id_001 ON generated_designs(session_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_estimates_session_id_001 ON estimates(session_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_inquiries_session_id_001 ON inquiries(session_id) WHERE deleted_at IS NULL;

-- 3. Enable RLS
ALTER TABLE design_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

-- 4. Create Basic RLS Policies
CREATE POLICY "Allow anonymous insert for sessions"
  ON design_sessions FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow select for anonymous sessions"
  ON design_sessions FOR SELECT TO anon USING (true);

CREATE POLICY "Allow select for anonymous designs"
  ON generated_designs FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anonymous estimates"
  ON estimates FOR ALL TO anon USING (true);

CREATE POLICY "Allow anonymous inquiry insert"
  ON inquiries FOR INSERT TO anon WITH CHECK (true);

COMMIT;
