-- SIM Budget System database schema
-- Single-user internal platform. Enable RLS in production and restrict access to the owner account.

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company text,
  whatsapp text,
  email text,
  created_at timestamptz not null default now()
);

create table if not exists system_settings (
  id uuid primary key default gen_random_uuid(),
  fee_percentage numeric not null default 15,
  tax_percentage numeric not null default 7,
  proposal_validity_days integer not null default 30,
  updated_at timestamptz not null default now()
);

create table if not exists price_list (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  name text not null,
  sale_price numeric not null default 0,
  cost_price numeric not null default 0,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists budgets (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id),
  client_name text not null,
  client_company text,
  client_whatsapp text,
  client_email text,
  project_name text not null,
  project_type text not null,
  project_description text,
  production jsonb not null default '{}'::jsonb,
  deliverables jsonb not null default '{}'::jsonb,
  status text not null default 'Draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null,
  proposal_date date not null default current_date,
  online_slug text not null unique,
  cost_total numeric not null default 0,
  fee_value numeric not null default 0,
  tax_value numeric not null default 0,
  final_price numeric not null default 0,
  profit numeric not null default 0,
  margin numeric not null default 0,
  material_bruto_value numeric not null default 0
);

create table if not exists budget_items (
  id uuid primary key default gen_random_uuid(),
  budget_id uuid not null references budgets(id) on delete cascade,
  price_list_id uuid references price_list(id),
  category text not null,
  name text not null,
  quantity numeric not null default 1,
  sale_price numeric not null default 0,
  cost_price numeric not null default 0,
  subtotal_sale numeric not null default 0,
  subtotal_cost numeric not null default 0,
  custom_pricing boolean not null default false
);

create table if not exists templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  project_type text not null,
  production jsonb not null default '{}'::jsonb,
  deliverables jsonb not null default '{}'::jsonb,
  price_item_names text[] not null default '{}',
  created_at timestamptz not null default now()
);