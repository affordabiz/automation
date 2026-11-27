-- Page views per form. Kept in its own table so counting a view does not
-- bump forms.updated_at (the forms list is sorted by it).

create table public.form_stats (
  form_id uuid primary key references public.forms (id) on delete cascade,
  views bigint not null default 0 check (views >= 0)
);

alter table public.form_stats enable row level security;
revoke all on public.form_stats from anon, authenticated;
grant select, insert, update, delete on public.form_stats to service_role;

create function public.increment_form_view(p_form_id uuid) returns void
  language sql
  security definer
  set search_path = public
as $$
  insert into public.form_stats (form_id, views) values (p_form_id, 1)
  on conflict (form_id) do update set views = public.form_stats.views + 1;
$$;

revoke execute on function public.increment_form_view(uuid) from public, anon, authenticated;
grant execute on function public.increment_form_view(uuid) to service_role;
