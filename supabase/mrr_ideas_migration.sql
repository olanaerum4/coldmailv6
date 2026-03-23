-- Migration: MRR history + integrations
-- Run in Supabase SQL Editor

create table if not exists mrr_snapshots (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references founder_projects(id) on delete cascade,
  mrr int not null default 0,
  customers int not null default 0,
  recorded_at date not null default current_date,
  unique(project_id, recorded_at)
);

alter table mrr_snapshots enable row level security;
create policy "Allow all" on mrr_snapshots for all using (true);

-- External integrations config per project
alter table founder_projects
  add column if not exists supabase_url text,
  add column if not exists supabase_service_key text,
  add column if not exists mrr_query text, -- SQL query to run against external supabase
  add column if not exists auto_sync boolean default false;

create table if not exists ideas (
  id uuid primary key default uuid_generate_v4(),
  text text not null,
  project_id uuid references founder_projects(id) on delete set null,
  status text not null default 'new' check (status in ('new', 'doing', 'done', 'trashed')),
  created_at timestamptz not null default now()
);

alter table ideas enable row level security;
create policy "Allow all" on ideas for all using (true);
