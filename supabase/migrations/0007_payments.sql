-- Stripe payments. A client pays first; a paid payment unlocks one webpage form submission.
-- When the new webpage replaces an older one, the older page moves to draft.

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  product text not null check (product in ('renew', 'new')),
  amount_cents integer not null check (amount_cents > 0),
  currency text not null default 'usd',
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'failed', 'expired', 'refunded', 'disputed')),
  email text,
  customer_name text,
  stripe_session_id text,
  stripe_payment_intent_id text,
  stripe_customer_id text,
  stripe_invoice_id text,
  invoice_url text,
  invoice_pdf text,
  livemode boolean not null default false,
  failure_reason text,
  failed_attempts integer not null default 0,
  failure_notified_at timestamptz,
  access_token uuid not null default gen_random_uuid(),
  access_email_sent_at timestamptz,
  entry_id uuid references public.entries (id) on delete set null,
  previous_entry_id uuid references public.entries (id) on delete set null,
  used_at timestamptz,
  paid_at timestamptz,
  amount_refunded_cents integer not null default 0,
  refunded_at timestamptz,
  disputed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index payments_session_unique on public.payments (stripe_session_id) where stripe_session_id is not null;
create unique index payments_access_token_unique on public.payments (access_token);
create index payments_intent_idx on public.payments (stripe_payment_intent_id) where stripe_payment_intent_id is not null;
create index payments_status_created_idx on public.payments (status, created_at desc);
create index payments_created_idx on public.payments (created_at desc);

-- Stripe event ids already handled, so a redelivered webhook is ignored.
create table public.payment_events (
  id text primary key,
  type text not null,
  payment_id uuid references public.payments (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.entries add column payment_id uuid references public.payments (id) on delete set null;
create index entries_payment_idx on public.entries (payment_id) where payment_id is not null;

create trigger payments_updated_at before update on public.payments
  for each row execute function public.set_updated_at();

-- Moves the old webpage to draft and gives the new entry its web address, in one step.
-- The old page gets an archived address so the client can keep their original one.
create function public.replace_entry(p_old_id uuid, p_new_id uuid, p_slug text)
returns text
language plpgsql set search_path = '' as $$
declare
  old_slug text;
begin
  select slug into old_slug from public.entries where id = p_old_id for update;
  if old_slug is null then raise exception 'old entry not found'; end if;

  update public.entries
  set status = 'draft',
      slug = case when slug = p_slug
        then regexp_replace(left(slug, 41), '-+$', '') || '-' || left(id::text, 8)
        else slug end
  where id = p_old_id;

  update public.entries set slug = p_slug where id = p_new_id;
  return old_slug;
end $$;

alter table public.payments enable row level security;
alter table public.payment_events enable row level security;
revoke all on public.payments, public.payment_events from anon, authenticated;
grant select, insert, update, delete on public.payments, public.payment_events to service_role;
revoke execute on function public.replace_entry(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.replace_entry(uuid, uuid, text) to service_role;

update public.roles
set permissions = (select array_agg(distinct p) from unnest(permissions || array['payments.view']) as p)
where name = 'Admin' and not is_owner;
