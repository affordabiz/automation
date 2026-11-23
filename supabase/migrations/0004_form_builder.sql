-- Form builder: editable drafts, published versions, submissions and private file uploads.

alter table public.forms
  add column slug text,
  add column description text not null default '',
  add column draft_schema jsonb not null default '{"fields": [], "settings": {}}'::jsonb,
  add column published_schema jsonb,
  add column published_at timestamptz,
  add column created_by uuid,
  add column is_system boolean not null default false;

update public.forms set slug = 'website-onboarding', is_system = true where key = 'onboarding';
update public.forms set status = 'draft' where key <> 'onboarding' and status = 'published';

alter table public.forms alter column slug set not null;
alter table public.forms add constraint forms_slug_format
  check (slug ~ '^[a-z0-9](?:[a-z0-9-]{1,48}[a-z0-9])$' and slug !~ '--');
create unique index forms_slug_unique on public.forms (slug);
create index forms_updated_idx on public.forms (updated_at desc);

create table public.form_submissions (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.forms (id) on delete cascade,
  answers jsonb not null,
  entry_id uuid references public.entries (id) on delete set null,
  source text not null default 'link' check (source in ('link', 'embed')),
  created_at timestamptz not null default now()
);
create index form_submissions_form_idx on public.form_submissions (form_id, created_at desc);

alter table public.form_submissions enable row level security;
revoke all on public.form_submissions from anon, authenticated;
grant select, insert, update, delete on public.form_submissions to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('form-uploads', 'form-uploads', false, 4194304, array[
    'image/png', 'image/jpeg', 'image/webp', 'application/pdf', 'text/plain', 'text/csv',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]);
