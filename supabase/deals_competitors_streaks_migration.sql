-- Migration: deals, competitors, streaks
-- Run in Supabase SQL Editor

-- Deal tracker / pipeline
create table if not exists deals (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references founder_projects(id) on delete set null,
  name text not null,
  company text,
  contact_email text,
  value int not null default 0,
  probability int not null default 50 check (probability between 0 and 100),
  stage text not null default 'lead' check (stage in ('lead','contacted','demo','proposal','won','lost')),
  notes text,
  expected_close date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Competitor monitoring
create table if not exists competitors (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  url text not null,
  project_id uuid references founder_projects(id) on delete set null,
  last_content text,
  last_checked_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists competitor_changes (
  id uuid primary key default uuid_generate_v4(),
  competitor_id uuid not null references competitors(id) on delete cascade,
  summary text not null,
  detected_at timestamptz not null default now()
);

-- Outreach streaks / goals
create table if not exists outreach_goals (
  id uuid primary key default uuid_generate_v4(),
  daily_emails int not null default 10,
  daily_replies int not null default 2,
  streak_days int not null default 0,
  last_active_date date,
  updated_at timestamptz not null default now()
);

-- Insert default goal
insert into outreach_goals (daily_emails, daily_replies, streak_days) values (10, 2, 0)
  on conflict do nothing;

alter table deals enable row level security;
alter table competitors enable row level security;
alter table competitor_changes enable row level security;
alter table outreach_goals enable row level security;
create policy "Allow all" on deals for all using (true);
create policy "Allow all" on competitors for all using (true);
create policy "Allow all" on competitor_changes for all using (true);
create policy "Allow all" on outreach_goals for all using (true);
