-- Migration: Founder dashboard
-- Run in Supabase SQL Editor

create table if not exists founder_projects (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  url text,
  status text not null default 'active' check (status in ('active', 'building', 'paused', 'idea')),
  mrr int not null default 0,
  customers int not null default 0,
  emoji text default '🚀',
  color text default '#2563eb',
  sort_order int default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists founder_todos (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references founder_projects(id) on delete cascade,
  text text not null,
  done boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists founder_notes (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references founder_projects(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

alter table founder_projects enable row level security;
alter table founder_todos enable row level security;
alter table founder_notes enable row level security;
create policy "Allow all" on founder_projects for all using (true);
create policy "Allow all" on founder_todos for all using (true);
create policy "Allow all" on founder_notes for all using (true);

-- Seed initial projects
insert into founder_projects (name, description, url, status, mrr, customers, emoji, color, sort_order) values
  ('OutreachOS', 'Cold email automation tool', null, 'building', 0, 0, '📧', '#2563eb', 1),
  ('LokalProfil.no', 'SMS-påminnelser og Google-anmeldelser for SMB', 'https://lokalprofil.no', 'active', 0, 0, '⭐', '#059669', 2),
  ('StartLokalt.no', 'Nettside-tjeneste for lokale bedrifter', 'https://startlokalt.no', 'active', 0, 0, '🌐', '#7c3aed', 3),
  ('Domene Flipping', 'Kjøp og salg av domener', null, 'idea', 0, 0, '🌍', '#d97706', 4);
