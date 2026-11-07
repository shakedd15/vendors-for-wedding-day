-- Run manually in the existing Supabase project's SQL Editor.
-- Adds one nullable field without changing existing vendor or appointment data.
begin;

alter table public.vendors
  add column if not exists additional_details text;

-- The anonymous app may update the details field only.
revoke update on table public.vendors from anon;
revoke update (id, name, service_type) on table public.vendors from anon;
grant update (additional_details) on table public.vendors to anon;

do $$
begin
  -- Stop safely if another inherited grant still permits editing other fields.
  if exists (
    select 1
    from pg_attribute
    where attrelid = 'public.vendors'::regclass
      and attnum > 0
      and not attisdropped
      and attname <> 'additional_details'
      and has_column_privilege('anon', 'public.vendors', attname, 'UPDATE')
  ) then
    raise exception 'anon inherits UPDATE privileges for other vendor fields; review those grants before enabling vendor details';
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'vendors'
      and policyname = 'vendor_additional_details_update'
  ) then
    execute 'create policy vendor_additional_details_update on public.vendors for update to anon using (true) with check (true)';
  end if;
end $$;

notify pgrst, 'reload schema';
commit;
