-- SIM Budget System — schema real do Supabase
-- Autenticação: usa o Supabase Auth (auth.users) — não existe tabela "users" própria.
-- Crie o único usuário do sistema em Authentication > Users no painel do Supabase.
--
-- Como aplicar: cole este arquivo inteiro no SQL Editor do Supabase e rode.
-- É seguro rodar mais de uma vez (usa "if not exists" / "on conflict do nothing").

create extension if not exists pgcrypto;

-- ─────────────────────────────────────────────────────────────────────────
-- Tabelas
-- ─────────────────────────────────────────────────────────────────────────

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
  cost_base numeric not null default 0,
  price_base numeric not null default 0,
  fee_percent numeric not null default 15,
  tax_percent numeric not null default 7,
  sale_price numeric not null default 0,
  cost_price numeric not null default 0,
  custom_fee boolean not null default false,
  custom_tax boolean not null default false,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

-- Modelos de orçamento (id fixo em texto — não são criados pelo app, só lidos)
create table if not exists templates (
  id text primary key,
  name text not null,
  description text,
  project_type text not null,
  production jsonb not null default '{}'::jsonb,
  service_names text[] not null default '{}',
  reel_names text[] not null default '{}',
  equipment_names text[] not null default '{}',
  professional_names text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- Orçamentos: os itens (serviços, reels, equipamentos, profissionais) ficam
-- em colunas jsonb porque cada item carrega uma estrutura variável (preço
-- aplicado, preço base, overrides) definida no frontend.
create table if not exists budgets (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete set null,
  client_name text not null,
  client_company text,
  client_whatsapp text,
  client_email text,
  project_name text not null,
  project_type text not null,
  project_description text,
  production jsonb not null default '{}'::jsonb,
  services jsonb not null default '[]'::jsonb,
  reels jsonb not null default '[]'::jsonb,
  equipment jsonb not null default '[]'::jsonb,
  professionals jsonb not null default '[]'::jsonb,
  status text not null default 'Draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null,
  proposal_date timestamptz not null default now(),
  online_slug text not null unique,
  cost_total numeric not null default 0,
  fee_value numeric not null default 0,
  tax_value numeric not null default 0,
  final_price numeric not null default 0,
  profit numeric not null default 0,
  margin numeric not null default 0,
  material_bruto_value numeric not null default 0,
  -- Valor final exibido para o cliente (PDF do cliente e proposta pública).
  -- Quando nulo, usa o final_price calculado a partir dos itens. Quando
  -- preenchido, sobrescreve SÓ o que o cliente vê — custo, lucro e margem
  -- internos continuam calculados a partir dos itens normalmente.
  client_price_override numeric
);

create index if not exists budgets_created_at_idx on budgets (created_at desc);
create index if not exists budgets_online_slug_idx on budgets (online_slug);

-- ─────────────────────────────────────────────────────────────────────────
-- Migração idempotente: "create table if not exists" não adiciona colunas
-- que faltam em uma tabela que já existe (ex.: se a tabela foi criada por
-- uma versão anterior deste script). Os "add column if not exists" abaixo
-- garantem que rodar este arquivo de novo sempre deixa o schema completo,
-- não importa o estado atual do banco.
-- ─────────────────────────────────────────────────────────────────────────

alter table clients add column if not exists name text;
alter table clients add column if not exists company text;
alter table clients add column if not exists whatsapp text;
alter table clients add column if not exists email text;
alter table clients add column if not exists created_at timestamptz not null default now();

alter table system_settings add column if not exists fee_percentage numeric not null default 15;
alter table system_settings add column if not exists tax_percentage numeric not null default 7;
alter table system_settings add column if not exists proposal_validity_days integer not null default 30;
alter table system_settings add column if not exists updated_at timestamptz not null default now();

alter table price_list add column if not exists category text;
alter table price_list add column if not exists name text;
alter table price_list add column if not exists cost_base numeric not null default 0;
alter table price_list add column if not exists price_base numeric not null default 0;
alter table price_list add column if not exists fee_percent numeric not null default 15;
alter table price_list add column if not exists tax_percent numeric not null default 7;
alter table price_list add column if not exists sale_price numeric not null default 0;
alter table price_list add column if not exists cost_price numeric not null default 0;
alter table price_list add column if not exists custom_fee boolean not null default false;
alter table price_list add column if not exists custom_tax boolean not null default false;
alter table price_list add column if not exists active boolean not null default true;
alter table price_list add column if not exists updated_at timestamptz not null default now();

alter table templates add column if not exists name text;
alter table templates add column if not exists description text;
alter table templates add column if not exists project_type text;
alter table templates add column if not exists production jsonb not null default '{}'::jsonb;
alter table templates add column if not exists service_names text[] not null default '{}';
alter table templates add column if not exists reel_names text[] not null default '{}';
alter table templates add column if not exists equipment_names text[] not null default '{}';
alter table templates add column if not exists professional_names text[] not null default '{}';
alter table templates add column if not exists created_at timestamptz not null default now();

alter table budgets add column if not exists client_id uuid references clients(id) on delete set null;
alter table budgets add column if not exists client_name text;
alter table budgets add column if not exists client_company text;
alter table budgets add column if not exists client_whatsapp text;
alter table budgets add column if not exists client_email text;
alter table budgets add column if not exists project_name text;
alter table budgets add column if not exists project_type text;
alter table budgets add column if not exists project_description text;
alter table budgets add column if not exists production jsonb not null default '{}'::jsonb;
alter table budgets add column if not exists services jsonb not null default '[]'::jsonb;
alter table budgets add column if not exists reels jsonb not null default '[]'::jsonb;
alter table budgets add column if not exists equipment jsonb not null default '[]'::jsonb;
alter table budgets add column if not exists professionals jsonb not null default '[]'::jsonb;
alter table budgets add column if not exists status text not null default 'Draft';
alter table budgets add column if not exists created_at timestamptz not null default now();
alter table budgets add column if not exists updated_at timestamptz not null default now();
alter table budgets add column if not exists expires_at timestamptz;
alter table budgets add column if not exists proposal_date timestamptz not null default now();
alter table budgets add column if not exists online_slug text;
alter table budgets add column if not exists cost_total numeric not null default 0;
alter table budgets add column if not exists fee_value numeric not null default 0;
alter table budgets add column if not exists tax_value numeric not null default 0;
alter table budgets add column if not exists final_price numeric not null default 0;
alter table budgets add column if not exists profit numeric not null default 0;
alter table budgets add column if not exists margin numeric not null default 0;
alter table budgets add column if not exists material_bruto_value numeric not null default 0;
alter table budgets add column if not exists client_price_override numeric;

-- ─────────────────────────────────────────────────────────────────────────
-- updated_at automático
-- ─────────────────────────────────────────────────────────────────────────

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_budgets_updated_at on budgets;
create trigger trg_budgets_updated_at
  before update on budgets
  for each row execute function set_updated_at();

drop trigger if exists trg_price_list_updated_at on price_list;
create trigger trg_price_list_updated_at
  before update on price_list
  for each row execute function set_updated_at();

drop trigger if exists trg_system_settings_updated_at on system_settings;
create trigger trg_system_settings_updated_at
  before update on system_settings
  for each row execute function set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────
-- Row Level Security
-- Sistema interno de usuário único: qualquer sessão autenticada (o único
-- login do sistema) tem acesso completo. Sem sessão (anon), nenhum acesso
-- direto às tabelas — a proposta pública passa pela função RPC abaixo, que
-- expõe só os campos necessários (sem custo, lucro ou margem).
-- ─────────────────────────────────────────────────────────────────────────

alter table clients enable row level security;
alter table system_settings enable row level security;
alter table price_list enable row level security;
alter table templates enable row level security;
alter table budgets enable row level security;

drop policy if exists "authenticated full access" on clients;
create policy "authenticated full access" on clients
  for all to authenticated using (true) with check (true);

drop policy if exists "authenticated full access" on system_settings;
create policy "authenticated full access" on system_settings
  for all to authenticated using (true) with check (true);

drop policy if exists "authenticated full access" on price_list;
create policy "authenticated full access" on price_list
  for all to authenticated using (true) with check (true);

drop policy if exists "authenticated full access" on templates;
create policy "authenticated full access" on templates
  for all to authenticated using (true) with check (true);

drop policy if exists "authenticated full access" on budgets;
create policy "authenticated full access" on budgets
  for all to authenticated using (true) with check (true);

-- ─────────────────────────────────────────────────────────────────────────
-- Proposta pública (/proposal/:slug) — função com privilégio elevado que
-- devolve só os campos que o cliente final pode ver. Não expõe custo_base,
-- fee, imposto, lucro ou margem de cada item, nem os campos internos do
-- orçamento (cost_total, profit, margin etc).
-- ─────────────────────────────────────────────────────────────────────────

create or replace function get_public_proposal(p_slug text)
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select jsonb_build_object(
    'id', id,
    'project_name', project_name,
    'client_name', client_name,
    'project_type', project_type,
    'project_description', project_description,
    'production', production,
    'proposal_date', proposal_date,
    'expires_at', expires_at,
    'online_slug', online_slug,
    'final_price', coalesce(client_price_override, final_price),
    'status', status,
    'services', (
      select coalesce(jsonb_agg(jsonb_build_object('name', item->>'name')), '[]'::jsonb)
      from jsonb_array_elements(services) item
    ),
    'reels', (
      select coalesce(jsonb_agg(jsonb_build_object('name', item->>'name', 'quantity', (item->>'quantity')::numeric)), '[]'::jsonb)
      from jsonb_array_elements(reels) item
    )
  )
  from budgets
  where online_slug = p_slug
  limit 1;
$$;

revoke all on function get_public_proposal(text) from public;
grant execute on function get_public_proposal(text) to anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────
-- Seeds indispensáveis (configuração do sistema, não "dados de usuário")
-- ─────────────────────────────────────────────────────────────────────────

insert into system_settings (fee_percentage, tax_percentage, proposal_validity_days)
select 15, 7, 30
where not exists (select 1 from system_settings);

insert into templates (id, name, description, project_type, production, service_names, reel_names, equipment_names, professional_names) values
('template-institucional', 'Institucional', 'Narrativa de marca com entrevistas, cenas de atmosfera e acabamento premium.', 'Institucional',
  '{"shooting_days":2,"city":"Belo Horizonte","need_transportation":true,"need_lodging":false,"delivery_days":20}'::jsonb,
  array['Roteiro','Diretor','Filmmaker','Diretor de Fotografia','Edição de Vídeo','Color Grading','Sound Design'],
  array['Edição de Reel'],
  array['Câmera','Lentes','Iluminação'],
  array['Diretor','Filmmaker','Diretor de Fotografia']),
('template-evento', 'Evento', 'Cobertura de evento com captação multicâmera, fotografia e entrega social.', 'Evento',
  '{"shooting_days":1,"city":"Belo Horizonte","need_transportation":true,"need_lodging":false,"delivery_days":5}'::jsonb,
  array['Edição Sameday','Edição de Vídeo','Transporte Van','Alimentação'],
  array['Edição de Reel','Edição de Reel'],
  array['Câmera','Iluminação'],
  array['Filmmaker','Fotógrafo']),
('template-publicidade', 'Publicidade', 'Campanha com direção criativa, produção robusta e pós-produção completa.', 'Publicidade',
  '{"shooting_days":2,"city":"Belo Horizonte","need_transportation":true,"need_lodging":false,"delivery_days":25}'::jsonb,
  array['Roteiro','Storyboard','Produtor Executivo','Produtor','Diretor','Diretor de Fotografia','Assistente de Câmera','Gaffer','Edição de Vídeo','Motion','Color Grading','Sound Design'],
  array['Edição de Reel','Motion Design Reel'],
  array['Câmera','Lentes','Iluminação'],
  array['Diretor','Diretor de Fotografia','Filmmaker']),
('template-podcast', 'Podcast', 'Captação multicâmera com áudio dedicado e edição para episódio completo e cortes.', 'Podcast',
  '{"shooting_days":1,"city":"Belo Horizonte","need_transportation":true,"need_lodging":false,"delivery_days":7}'::jsonb,
  array['Edição de Vídeo','Sound Design'],
  array['Edição de Reel'],
  array['Câmera','Iluminação'],
  array['Filmmaker','Operador de Áudio']),
('template-reels', 'Reels', 'Produção vertical enxuta com ritmo editorial e entrega rápida.', 'Reels',
  '{"shooting_days":1,"city":"Belo Horizonte","need_transportation":false,"need_lodging":false,"delivery_days":3}'::jsonb,
  array['Edição de Vídeo','Motion','Transporte Uber'],
  array['Edição de Reel','Edição de Reel','Edição de Reel','Edição de Reel'],
  array['Câmera'],
  array['Filmmaker','Fotógrafo']),
('template-cobertura', 'Cobertura', 'Cobertura documental com fotografia, vídeo e pacote de redes sociais.', 'Cobertura',
  '{"shooting_days":1,"city":"Belo Horizonte","need_transportation":true,"need_lodging":false,"delivery_days":7}'::jsonb,
  array['Edição de Vídeo','Color Grading','Transporte Van','Alimentação'],
  array['Edição de Reel'],
  array['Câmera'],
  array['Filmmaker','Fotógrafo'])
on conflict (id) do nothing;
