-- SOLIVAN — hardening RLS / snapshots / historial (post-auditoría)
-- - policies audit_log
-- - WRITE addresses
-- - bloquear self-escalation de profiles.role
-- - SELECT explícito para operator/viewer en tablas operativas
-- - snapshots de placa/proveedor en trips
-- - exceptions/incidents: ON DELETE RESTRICT (no borrar historial con la operación)

-- ---------------------------------------------------------------------------
-- Snapshots en trips (ADR-004)
-- ---------------------------------------------------------------------------
alter table public.trips
  add column if not exists vehicle_plate_snapshot text,
  add column if not exists provider_name_snapshot text;

-- ---------------------------------------------------------------------------
-- audit_log policies
-- ---------------------------------------------------------------------------
create policy audit_insert_authenticated on public.audit_log
  for insert to authenticated
  with check (auth.uid() is not null);

create policy audit_select_admin_planner on public.audit_log
  for select to authenticated
  using (public.has_role(array['admin','planner']::public.app_role[]));

-- ---------------------------------------------------------------------------
-- addresses WRITE
-- ---------------------------------------------------------------------------
create policy write_addresses on public.addresses
  for all to authenticated
  using (public.has_role(array['admin','planner']::public.app_role[]))
  with check (public.has_role(array['admin','planner']::public.app_role[]));

-- ---------------------------------------------------------------------------
-- SELECT explícito (operator/viewer) donde FOR ALL solo admin/planner
-- ---------------------------------------------------------------------------
create policy read_habitual on public.habitual_assignments
  for select to authenticated
  using (public.has_role(array['admin','planner','operator','viewer']::public.app_role[]));

create policy read_trips on public.trips
  for select to authenticated
  using (public.has_role(array['admin','planner','operator','viewer']::public.app_role[]));

create policy read_exceptions on public.assignment_exceptions
  for select to authenticated
  using (public.has_role(array['admin','planner','operator','viewer']::public.app_role[]));

create policy read_import_batches on public.import_batches
  for select to authenticated
  using (public.has_role(array['admin','planner','operator','viewer']::public.app_role[]));

create policy read_import_rows on public.import_batch_rows
  for select to authenticated
  using (public.has_role(array['admin','planner','operator','viewer']::public.app_role[]));

-- PII persons: quitar viewer (alinear con addresses)
drop policy if exists pii_read_persons on public.persons;
create policy pii_read_persons on public.persons
  for select to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.is_active
        and p.role in ('admin', 'planner', 'operator')
    )
  );

-- ---------------------------------------------------------------------------
-- Bloquear auto-escalada de role en profiles
-- ---------------------------------------------------------------------------
create or replace function public.prevent_profile_role_self_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_role public.app_role;
begin
  if tg_op = 'UPDATE' and new.role is distinct from old.role then
    select role into actor_role
    from public.profiles
    where id = auth.uid() and is_active;

    if actor_role is distinct from 'admin'::public.app_role then
      raise exception 'Solo admin puede cambiar profiles.role';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_profile_role_self_escalation on public.profiles;
create trigger trg_prevent_profile_role_self_escalation
  before update on public.profiles
  for each row
  execute function public.prevent_profile_role_self_escalation();

-- ---------------------------------------------------------------------------
-- Historial: no CASCADE al borrar operación
-- (replan ya no borra operation; esto protege deletes accidentales)
-- ---------------------------------------------------------------------------
alter table public.assignment_exceptions
  drop constraint if exists assignment_exceptions_operation_id_fkey;
alter table public.assignment_exceptions
  add constraint assignment_exceptions_operation_id_fkey
  foreign key (operation_id) references public.operations (id) on delete restrict;

alter table public.incidents
  drop constraint if exists incidents_operation_id_fkey;
alter table public.incidents
  add constraint incidents_operation_id_fkey
  foreign key (operation_id) references public.operations (id) on delete restrict;

comment on column public.trips.vehicle_plate_snapshot is
  'Patente congelada al planificar (historial de nómina).';
comment on column public.trips.provider_name_snapshot is
  'Nombre de proveedor congelado al planificar.';
