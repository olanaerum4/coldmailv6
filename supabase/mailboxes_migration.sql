-- Migration: Add mailboxes table
-- Run in Supabase SQL Editor

create table mailboxes (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text not null unique,
  smtp_host text not null,
  smtp_port int not null default 587,
  smtp_user text not null,
  smtp_password text not null,
  daily_limit int not null default 20,
  interval_minutes int not null default 5,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Track daily send count per mailbox
create table mailbox_sends (
  id uuid primary key default uuid_generate_v4(),
  mailbox_id uuid not null references mailboxes(id) on delete cascade,
  email_sent_id uuid not null references emails_sent(id) on delete cascade,
  sent_at timestamptz not null default now()
);

create index on mailbox_sends(mailbox_id, sent_at);

-- Link mailbox to campaign (optional: round-robin)
alter table campaigns add column if not exists mailbox_id uuid references mailboxes(id) on delete set null;

alter table mailboxes enable row level security;
alter table mailbox_sends enable row level security;
create policy "Allow all" on mailboxes for all using (true);
create policy "Allow all" on mailbox_sends for all using (true);
