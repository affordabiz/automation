-- Admin platform foundation: roles, team members and an append-only audit log.
-- All access goes through the Next.js server (service role) after a permission check.
-- anon/authenticated have no grants and no RLS policies, so direct client access is denied.

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 50),
  description text not null default '' check (char_length(description) <= 200),
  is_owner boolean not null default false,
  is_system boolean not null default false,
  permissions text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index roles_name_unique on public.roles (lower(name));
create unique index roles_single_owner on public.roles (is_owner) where is_owner;

create table public.team_members (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null check (char_length(trim(full_name)) between 1 and 100),
  role_id uuid not null references public.roles (id) on delete restrict,
  granted_permissions text[] not null default '{}',
  revoked_permissions text[] not null default '{}',
  status text not null default 'active' check (status in ('active', 'disabled')),
  invited_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index team_members_email_unique on public.team_members (lower(email));
create index team_members_role_idx on public.team_members (role_id);

create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid,
  actor_email text,
  action text not null,
  target_type text,
  target_id text,
  details jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index audit_log_created_idx on public.audit_log (created_at desc);

create function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger roles_updated_at before update on public.roles
  for each row execute function public.set_updated_at();
create trigger team_members_updated_at before update on public.team_members
  for each row execute function public.set_updated_at();

-- The Owner role cannot be deleted, renamed away or demoted.
create function public.protect_owner_role() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'DELETE' then
    if old.is_system then raise exception 'SYSTEM_ROLE'; end if;
    return old;
  end if;
  if old.is_owner and (new.is_owner is distinct from true or new.name is distinct from old.name) then
    raise exception 'SYSTEM_ROLE';
  end if;
  if new.is_owner and not old.is_owner then raise exception 'SYSTEM_ROLE'; end if;
  return new;
end $$;

create trigger roles_protect_owner before update or delete on public.roles
  for each row execute function public.protect_owner_role();

-- There must always be at least one active Owner.
create function public.protect_last_owner() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  owner_role uuid;
begin
  select id into owner_role from public.roles where is_owner;
  if old.role_id = owner_role and old.status = 'active'
     and (tg_op = 'DELETE' or new.role_id <> owner_role or new.status <> 'active') then
    perform pg_advisory_xact_lock(hashtext('team_members_last_owner'));
    if not exists (
      select 1 from public.team_members
      where role_id = owner_role and status = 'active' and user_id <> old.user_id
    ) then
      raise exception 'LAST_OWNER';
    end if;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end $$;

create trigger team_members_protect_last_owner before update or delete on public.team_members
  for each row execute function public.protect_last_owner();

-- Audit entries can be added but never changed or removed.
create function public.audit_log_immutable() returns trigger
language plpgsql set search_path = '' as $$
begin
  raise exception 'AUDIT_LOG_IMMUTABLE';
end $$;

create trigger audit_log_no_change before update or delete on public.audit_log
  for each row execute function public.audit_log_immutable();
create trigger audit_log_no_truncate before truncate on public.audit_log
  for each statement execute function public.audit_log_immutable();

alter table public.roles enable row level security;
alter table public.team_members enable row level security;
alter table public.audit_log enable row level security;

revoke all on public.roles, public.team_members, public.audit_log from anon, authenticated;
grant select, insert, update, delete on public.roles, public.team_members to service_role;
grant select, insert on public.audit_log to service_role;

revoke execute on function public.set_updated_at(), public.protect_owner_role(),
  public.protect_last_owner(), public.audit_log_immutable() from public, anon, authenticated;

insert into public.roles (name, description, is_owner, is_system, permissions) values
  ('Owner', 'Full access to everything, including future features.', true, true, '{}'),
  ('Admin', 'Runs forms, entries and webpages, and can view the team.', false, false,
    array['forms.view','forms.manage','forms.publish','entries.view','entries.review',
          'webpages.view','webpages.manage','team.view','audit.view']),
  ('Reviewer', 'Reviews entries and approves or rejects them.', false, false,
    array['forms.view','entries.view','entries.review','webpages.view']),
  ('Support', 'Read-only access to entries and webpages.', false, false,
    array['entries.view','webpages.view']);
