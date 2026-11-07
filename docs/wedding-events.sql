-- Owner-run setup for this wedding's shared moments. Not run by the application.
begin;
do $setup$
begin
  if to_regclass('public.wedding_events') is null then
    create table public.wedding_events (
      id uuid primary key default gen_random_uuid(),
      title text not null check (length(btrim(title)) > 0),
      start_time time not null,
      end_time time,
      check (end_time is null or end_time > start_time)
    );
    insert into public.wedding_events (title, start_time, end_time) values
      ('צילומי כלה', '14:30', '15:00'),
      ('מפגש חתן וכלה', '15:00', null),
      ('צילומי זוגיות', '15:10', '17:00');
  end if;
end $setup$;

alter table public.wedding_events enable row level security;
revoke all on table public.wedding_events from anon;
revoke insert (id), update (id) on table public.wedding_events from anon;
grant select on table public.wedding_events to anon;
grant insert (title, start_time, end_time), update (title, start_time, end_time)
  on table public.wedding_events to anon;

do $policies$
begin
  if has_column_privilege('anon', 'public.wedding_events', 'id', 'UPDATE') then
    raise exception 'anon inherits permission to change event IDs; review inherited grants';
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'wedding_events' and policyname = 'wedding_events_read') then
    execute 'create policy wedding_events_read on public.wedding_events for select to anon using (true)';
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'wedding_events' and policyname = 'wedding_events_insert') then
    execute 'create policy wedding_events_insert on public.wedding_events for insert to anon with check (true)';
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'wedding_events' and policyname = 'wedding_events_update') then
    execute 'create policy wedding_events_update on public.wedding_events for update to anon using (true) with check (true)';
  end if;
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') and not exists (
    select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'wedding_events'
  ) then
    alter publication supabase_realtime add table public.wedding_events;
  end if;
end $policies$;
notify pgrst, 'reload schema';
commit;
