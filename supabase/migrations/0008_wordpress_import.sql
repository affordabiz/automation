-- Webpages copied from the old WordPress site keep a record of where they came from.

alter table public.entries drop constraint entries_source_check;
alter table public.entries add constraint entries_source_check
  check (source in ('form', 'sanity', 'wordpress'));
