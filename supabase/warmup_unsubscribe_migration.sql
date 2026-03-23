-- Migration: global unsubscribe list + warm-up
-- Run in Supabase SQL Editor

-- Global unsubscribe list (across all campaigns)
create table if not exists global_unsubscribes (
  id uuid primary key default uuid_generate_v4(),
  email text not null unique,
  reason text, -- 'manual', 'bounce', 'complaint', 'unsubscribe'
  created_at timestamptz not null default now()
);

create index on global_unsubscribes(email);
alter table global_unsubscribes enable row level security;
create policy "Allow all" on global_unsubscribes for all using (true);

-- Warm-up schedule per mailbox
create table if not exists warmup_schedule (
  id uuid primary key default uuid_generate_v4(),
  mailbox_id uuid not null references mailboxes(id) on delete cascade,
  day int not null default 1,         -- current warm-up day
  emails_today int not null default 0,
  max_per_day int not null default 2, -- starts low, increases
  active boolean not null default true,
  started_at timestamptz not null default now(),
  last_run_at timestamptz,
  unique(mailbox_id)
);

alter table warmup_schedule enable row level security;
create policy "Allow all" on warmup_schedule for all using (true);

-- Warm-up email log
create table if not exists warmup_emails (
  id uuid primary key default uuid_generate_v4(),
  from_mailbox_id uuid not null references mailboxes(id) on delete cascade,
  to_mailbox_id uuid not null references mailboxes(id) on delete cascade,
  message_id text,
  subject text,
  sent_at timestamptz not null default now(),
  replied_at timestamptz
);

alter table warmup_emails enable row level security;
create policy "Allow all" on warmup_emails for all using (true);

-- Agent API keys
create table if not exists agent_keys (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  key_hash text not null unique,
  last_used_at timestamptz,
  created_at timestamptz not null default now()
);

alter table agent_keys enable row level security;
create policy "Allow all" on agent_keys for all using (true);
