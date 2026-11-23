-- Forms, reviewable entries, contact messages and image storage.
-- An approved entry is a live webpage. A rejected entry releases its web address.

create table public.forms (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  status text not null default 'published' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.forms (key, name) values ('onboarding', 'Website onboarding');

create table public.entries (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.forms (id) on delete restrict,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'suspended')),
  slug text not null check (slug ~ '^[a-z0-9](?:[a-z0-9-]{1,48}[a-z0-9])$' and slug !~ '--'),
  template_number integer not null check (template_number between 1 and 7),
  full_name text not null,
  business_name text not null,
  email text not null,
  phone text not null,
  address text not null,
  serving_area text not null,
  logo_path text,
  photo_path text,
  logo_url text,
  photo_url text,
  review_note text check (char_length(review_note) <= 1000),
  reviewed_by uuid,
  reviewed_by_email text,
  reviewed_at timestamptz,
  published_at timestamptz,
  client_email_status text check (client_email_status in ('sent', 'failed', 'not_sent')),
  source text not null default 'form' check (source in ('form', 'sanity')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint entries_pending_has_uploads check (status <> 'pending' or (logo_path is not null and photo_path is not null)),
  constraint entries_live_has_images check (status not in ('approved', 'suspended') or (logo_url is not null and photo_url is not null))
);
create unique index entries_active_slug_unique on public.entries (slug) where status <> 'rejected';
create index entries_status_created_idx on public.entries (status, created_at desc);
create index entries_form_idx on public.entries (form_id);

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.entries (id) on delete cascade,
  name text not null,
  email text not null,
  phone text not null default '',
  message text not null,
  email_status text not null check (email_status in ('sent', 'failed')),
  created_at timestamptz not null default now()
);
create index contact_messages_entry_idx on public.contact_messages (entry_id, created_at desc);

create trigger forms_updated_at before update on public.forms
  for each row execute function public.set_updated_at();
create trigger entries_updated_at before update on public.entries
  for each row execute function public.set_updated_at();

alter table public.forms enable row level security;
alter table public.entries enable row level security;
alter table public.contact_messages enable row level security;

revoke all on public.forms, public.entries, public.contact_messages from anon, authenticated;
grant select, insert, update, delete on public.forms, public.entries, public.contact_messages to service_role;

-- entry-uploads is private. Images are copied to webpage-assets only when an entry is approved.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('entry-uploads', 'entry-uploads', false, 5242880, array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']),
  ('webpage-assets', 'webpage-assets', true, 5242880, array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']);
