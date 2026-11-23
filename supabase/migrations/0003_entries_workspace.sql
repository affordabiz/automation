-- Draft status, auto-publish setting and per-entry email conversations.

-- Rejected entries become drafts. A draft keeps its web address, so resolve any duplicates first.
drop index public.entries_active_slug_unique;

update public.entries e
set slug = regexp_replace(left(e.slug, 41), '-+$', '') || '-' || left(e.id::text, 8)
where e.status = 'rejected'
  and exists (select 1 from public.entries other where other.slug = e.slug and other.id <> e.id and other.status <> 'rejected');

with ranked as (
  select id, row_number() over (partition by slug order by created_at desc, id) as position
  from public.entries
  where status = 'rejected'
)
update public.entries e
set slug = regexp_replace(left(e.slug, 41), '-+$', '') || '-' || left(e.id::text, 8)
from ranked r
where e.id = r.id and r.position > 1;

alter table public.entries drop constraint entries_status_check;
update public.entries set status = 'draft' where status = 'rejected';
alter table public.entries add constraint entries_status_check
  check (status in ('pending', 'approved', 'draft', 'suspended'));
alter table public.entries drop constraint entries_pending_has_uploads;
create unique index entries_slug_unique on public.entries (slug);

alter table public.entries add column reply_token uuid not null default gen_random_uuid();
create unique index entries_reply_token_unique on public.entries (reply_token);

create table public.entry_messages (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.entries (id) on delete cascade,
  direction text not null check (direction in ('outbound', 'inbound')),
  body text not null check (char_length(body) between 1 and 10000),
  author_id uuid,
  author_name text not null,
  email_status text check (email_status in ('sent', 'failed', 'not_sent')),
  provider_message_id text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index entry_messages_entry_idx on public.entry_messages (entry_id, created_at);
create index entry_messages_recent_idx on public.entry_messages (created_at desc);
create index entry_messages_unread_idx on public.entry_messages (created_at desc)
  where direction = 'inbound' and read_at is null;
create unique index entry_messages_provider_unique on public.entry_messages (provider_message_id)
  where provider_message_id is not null;

-- Keep earlier rejection reasons in the new conversation history.
insert into public.entry_messages (entry_id, direction, body, author_id, author_name, email_status, created_at)
select id, 'outbound', review_note, reviewed_by, coalesce(reviewed_by_email, 'Affordabiz'),
       client_email_status, coalesce(reviewed_at, updated_at)
from public.entries
where review_note is not null;

create table public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_by uuid,
  updated_at timestamptz not null default now()
);
insert into public.app_settings (key, value) values ('auto_publish', 'false'::jsonb);

create trigger app_settings_updated_at before update on public.app_settings
  for each row execute function public.set_updated_at();

alter table public.entry_messages enable row level security;
alter table public.app_settings enable row level security;
revoke all on public.entry_messages, public.app_settings from anon, authenticated;
grant select, insert, update, delete on public.entry_messages, public.app_settings to service_role;

update public.roles
set permissions = (select array_agg(distinct p) from unnest(permissions || array['entries.delete', 'settings.manage']) as p)
where name = 'Admin' and not is_owner;
