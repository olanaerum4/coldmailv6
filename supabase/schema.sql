-- Cold Outreach Tool – Database Schema
-- Run this in Supabase SQL Editor

create extension if not exists "uuid-ossp";

-- CAMPAIGNS
create table campaigns (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  from_email text not null,
  from_name text not null,
  status text not null default 'draft' check (status in ('draft', 'active', 'paused', 'completed')),
  created_at timestamptz not null default now()
);

-- SEQUENCES (steps in a campaign)
create table sequences (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  step_number int not null,
  delay_days int not null default 0,
  subject text not null,
  body text not null,
  created_at timestamptz not null default now(),
  unique(campaign_id, step_number)
);

-- LEADS
create table leads (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  email text not null,
  name text,
  company text,
  phone text,
  status text not null default 'pending' check (status in ('pending', 'active', 'replied', 'bounced', 'unsubscribed')),
  current_step int not null default 0,
  created_at timestamptz not null default now(),
  unique(campaign_id, email)
);

-- EMAILS SENT
create table emails_sent (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid not null references leads(id) on delete cascade,
  sequence_id uuid not null references sequences(id) on delete cascade,
  campaign_id uuid not null references campaigns(id) on delete cascade,
  sent_at timestamptz not null default now(),
  opened_at timestamptz,
  clicked_at timestamptz,
  replied_at timestamptz,
  open_count int not null default 0,
  click_count int not null default 0
);

-- TRACKING PIXELS
create table tracking_pixels (
  id uuid primary key default uuid_generate_v4(),
  email_sent_id uuid not null references emails_sent(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- INBOX
create table inbox_messages (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid references leads(id) on delete set null,
  email_sent_id uuid references emails_sent(id) on delete set null,
  from_email text not null,
  from_name text,
  subject text,
  body text,
  received_at timestamptz not null default now(),
  interest_status text check (interest_status in ('interested', 'not_interested', 'wrong_contact')),
  read boolean not null default false
);

-- INDEXES
create index on sequences(campaign_id);
create index on leads(campaign_id);
create index on leads(status);
create index on emails_sent(lead_id);
create index on emails_sent(campaign_id);
create index on tracking_pixels(email_sent_id);
create index on inbox_messages(lead_id);

-- RLS
alter table campaigns enable row level security;
alter table sequences enable row level security;
alter table leads enable row level security;
alter table emails_sent enable row level security;
alter table tracking_pixels enable row level security;
alter table inbox_messages enable row level security;

create policy "Allow all" on campaigns for all using (true);
create policy "Allow all" on sequences for all using (true);
create policy "Allow all" on leads for all using (true);
create policy "Allow all" on emails_sent for all using (true);
create policy "Allow all" on tracking_pixels for all using (true);
create policy "Allow all" on inbox_messages for all using (true);

-- Dashboard view
create or replace view campaign_stats as
select
  c.id as campaign_id,
  c.name,
  c.status,
  count(distinct l.id) as total_leads,
  count(distinct case when l.status = 'replied' then l.id end) as replied_leads,
  count(distinct es.id) as emails_sent,
  count(distinct case when es.opened_at is not null then es.id end) as emails_opened,
  count(distinct case when es.clicked_at is not null then es.id end) as emails_clicked,
  count(distinct case when es.replied_at is not null then es.id end) as emails_replied
from campaigns c
left join leads l on l.campaign_id = c.id
left join emails_sent es on es.campaign_id = c.id
group by c.id, c.name, c.status;
