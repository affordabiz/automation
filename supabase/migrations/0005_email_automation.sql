-- Email automations triggered by form submissions, with a durable send queue.

create table public.automations (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.forms (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 100),
  status text not null default 'draft' check (status in ('draft', 'active', 'paused')),
  match text not null default 'all' check (match in ('all', 'any')),
  conditions jsonb not null default '[]'::jsonb,
  steps jsonb not null default '[]'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index automations_form_status_idx on public.automations (form_id, status);
create index automations_updated_idx on public.automations (updated_at desc);

create table public.automation_jobs (
  id uuid primary key default gen_random_uuid(),
  automation_id uuid not null references public.automations (id) on delete cascade,
  submission_id uuid not null references public.form_submissions (id) on delete cascade,
  step_id text not null,
  to_email text not null,
  reply_to text,
  subject text not null,
  body text not null,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'sent', 'not_sent', 'failed', 'skipped')),
  attempts integer not null default 0,
  error text,
  scheduled_for timestamptz not null default now(),
  locked_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (automation_id, submission_id, step_id, to_email)
);
create index automation_jobs_due_idx on public.automation_jobs (scheduled_for)
  where status in ('pending', 'processing');
create index automation_jobs_activity_idx on public.automation_jobs (automation_id, created_at desc);
create index automation_jobs_recipient_idx on public.automation_jobs (to_email, created_at desc);

create trigger automations_updated_at before update on public.automations
  for each row execute function public.set_updated_at();

-- Claims due jobs safely when several workers run at once, and recovers jobs from crashed workers.
create function public.claim_automation_jobs(batch integer)
returns setof public.automation_jobs
language plpgsql set search_path = '' as $$
begin
  return query
  update public.automation_jobs j
  set status = 'processing', attempts = j.attempts + 1, locked_at = now()
  where j.id in (
    select c.id from public.automation_jobs c
    where (c.status = 'pending' and c.scheduled_for <= now())
       or (c.status = 'processing' and c.locked_at < now() - interval '10 minutes')
    order by c.scheduled_for
    limit greatest(least(batch, 50), 1)
    for update skip locked
  )
  returning j.*;
end $$;

alter table public.automations enable row level security;
alter table public.automation_jobs enable row level security;
revoke all on public.automations, public.automation_jobs from anon, authenticated;
grant select, insert, update, delete on public.automations, public.automation_jobs to service_role;
revoke execute on function public.claim_automation_jobs(integer) from public, anon, authenticated;
grant execute on function public.claim_automation_jobs(integer) to service_role;

update public.roles
set permissions = (select array_agg(distinct p) from unnest(permissions || array['automations.view', 'automations.manage']) as p)
where name = 'Admin' and not is_owner;
