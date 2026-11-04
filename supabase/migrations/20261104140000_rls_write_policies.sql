-- SOLIVAN — políticas de escritura adicionales (FASE 10)
-- Requiere perfiles con role admin/planner/operator según operación.

create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where id = auth.uid() and is_active
$$;

create or replace function public.has_role(allowed public.app_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_app_role() = any (allowed), false)
$$;

-- Catálogos: escritura admin/planner
create policy write_zones on public.zones
  for all to authenticated
  using (public.has_role(array['admin','planner']::public.app_role[]))
  with check (public.has_role(array['admin','planner']::public.app_role[]));

create policy write_communes on public.communes
  for all to authenticated
  using (public.has_role(array['admin','planner']::public.app_role[]))
  with check (public.has_role(array['admin','planner']::public.app_role[]));

create policy write_sectors on public.sectors
  for all to authenticated
  using (public.has_role(array['admin','planner']::public.app_role[]))
  with check (public.has_role(array['admin','planner']::public.app_role[]));

create policy write_providers on public.providers
  for all to authenticated
  using (public.has_role(array['admin','planner']::public.app_role[]))
  with check (public.has_role(array['admin','planner']::public.app_role[]));

create policy write_vehicles on public.vehicles
  for all to authenticated
  using (public.has_role(array['admin','planner']::public.app_role[]))
  with check (public.has_role(array['admin','planner']::public.app_role[]));

create policy write_persons on public.persons
  for all to authenticated
  using (public.has_role(array['admin','planner','operator']::public.app_role[]))
  with check (public.has_role(array['admin','planner','operator']::public.app_role[]));

create policy write_habitual on public.habitual_assignments
  for all to authenticated
  using (public.has_role(array['admin','planner']::public.app_role[]))
  with check (public.has_role(array['admin','planner']::public.app_role[]));

create policy write_import_batches on public.import_batches
  for all to authenticated
  using (public.has_role(array['admin','planner']::public.app_role[]))
  with check (public.has_role(array['admin','planner']::public.app_role[]));

create policy write_import_rows on public.import_batch_rows
  for all to authenticated
  using (public.has_role(array['admin','planner']::public.app_role[]))
  with check (public.has_role(array['admin','planner']::public.app_role[]));

create policy read_operations on public.operations
  for select to authenticated
  using (public.has_role(array['admin','planner','operator','viewer']::public.app_role[]));

create policy write_trips on public.trips
  for all to authenticated
  using (public.has_role(array['admin','planner']::public.app_role[]))
  with check (public.has_role(array['admin','planner']::public.app_role[]));

create policy write_trip_assignments on public.trip_assignments
  for all to authenticated
  using (public.has_role(array['admin','planner','operator']::public.app_role[]))
  with check (public.has_role(array['admin','planner','operator']::public.app_role[]));

create policy write_exceptions on public.assignment_exceptions
  for all to authenticated
  using (public.has_role(array['admin','planner']::public.app_role[]))
  with check (public.has_role(array['admin','planner']::public.app_role[]));

create policy write_incidents on public.incidents
  for all to authenticated
  using (public.has_role(array['admin','planner','operator']::public.app_role[]))
  with check (public.has_role(array['admin','planner','operator']::public.app_role[]));

create policy write_operation_passengers on public.operation_passengers
  for all to authenticated
  using (public.has_role(array['admin','planner','operator']::public.app_role[]))
  with check (public.has_role(array['admin','planner','operator']::public.app_role[]));

comment on function public.has_role is
  'Autorización RLS por rol de perfil activo.';
