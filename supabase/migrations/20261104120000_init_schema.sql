-- SOLIVAN FASE 1 — esquema inicial
-- Principio: maestro normalizado + operaciones con snapshot + RLS base

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type public.transport_condition as enum (
  'uses_transport',
  'no_transport',
  'pending_validation'
);

create type public.vehicle_status as enum (
  'available',
  'unavailable',
  'maintenance',
  'retired'
);

create type public.operation_status as enum (
  'draft',
  'planned',
  'confirmed',
  'in_execution',
  'completed',
  'cancelled'
);

create type public.passenger_execution_status as enum (
  'programmed',
  'assigned',
  'transported',
  'absent',
  'cancelled',
  'reassigned'
);

create type public.import_batch_status as enum (
  'pending',
  'validated',
  'imported',
  'rejected',
  'partial'
);

create type public.app_role as enum (
  'admin',
  'planner',
  'operator',
  'viewer'
);

-- ---------------------------------------------------------------------------
-- Auth / perfiles
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null,
  role public.app_role not null default 'viewer',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_log_entity_idx on public.audit_log (entity_type, entity_id);
create index audit_log_created_idx on public.audit_log (created_at desc);

-- ---------------------------------------------------------------------------
-- Geografía
-- ---------------------------------------------------------------------------

create table public.communes (
  id uuid primary key default gen_random_uuid(),
  code text,
  name text not null,
  region text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name)
);

create table public.zones (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sectors (
  id uuid primary key default gen_random_uuid(),
  zone_id uuid not null references public.zones (id),
  commune_id uuid references public.communes (id),
  code text not null,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (zone_id, code)
);

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  street_line text not null,
  reference text,
  commune_id uuid references public.communes (id),
  sector_id uuid references public.sectors (id),
  zone_id uuid references public.zones (id),
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index addresses_commune_idx on public.addresses (commune_id);
create index addresses_sector_idx on public.addresses (sector_id);
create index addresses_zone_idx on public.addresses (zone_id);

-- ---------------------------------------------------------------------------
-- Personas
-- ---------------------------------------------------------------------------

create table public.persons (
  id uuid primary key default gen_random_uuid(),
  external_id text not null,
  national_id text,
  full_name text not null,
  transport_condition public.transport_condition not null default 'pending_validation',
  phone text,
  email text,
  address_id uuid references public.addresses (id),
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (external_id)
);

create unique index persons_national_id_uq
  on public.persons (national_id)
  where national_id is not null;

create index persons_transport_condition_idx
  on public.persons (transport_condition)
  where is_active;

-- Asignación habitual: independiente de la operación
create table public.habitual_assignments (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.persons (id) on delete cascade,
  provider_id uuid,
  vehicle_id uuid,
  zone_id uuid references public.zones (id),
  sector_id uuid references public.sectors (id),
  shift_code text,
  pickup_notes text,
  valid_from date not null default current_date,
  valid_to date,
  is_current boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index habitual_assignments_current_uq
  on public.habitual_assignments (person_id)
  where is_current;

-- ---------------------------------------------------------------------------
-- Flota
-- ---------------------------------------------------------------------------

create table public.providers (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  contact_name text,
  contact_phone text,
  contact_email text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers (id),
  plate text not null unique,
  label text,
  authorized_capacity integer not null check (authorized_capacity > 0),
  status public.vehicle_status not null default 'available',
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index vehicles_provider_idx on public.vehicles (provider_id);
create index vehicles_status_idx on public.vehicles (status) where is_active;

alter table public.habitual_assignments
  add constraint habitual_assignments_provider_fk
  foreign key (provider_id) references public.providers (id);

alter table public.habitual_assignments
  add constraint habitual_assignments_vehicle_fk
  foreign key (vehicle_id) references public.vehicles (id);

-- ---------------------------------------------------------------------------
-- Turnos y importación
-- ---------------------------------------------------------------------------

create table public.shifts (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  start_time time not null,
  end_time time not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.import_batches (
  id uuid primary key default gen_random_uuid(),
  source_filename text not null,
  imported_by uuid references public.profiles (id),
  status public.import_batch_status not null default 'pending',
  row_count integer not null default 0,
  error_count integer not null default 0,
  mapping jsonb not null default '{}'::jsonb,
  summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.import_batch_rows (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.import_batches (id) on delete cascade,
  row_number integer not null,
  raw_payload jsonb not null,
  external_id text,
  validation_errors text[] not null default '{}',
  person_id uuid references public.persons (id),
  is_duplicate boolean not null default false,
  is_new_person boolean not null default false,
  created_at timestamptz not null default now(),
  unique (batch_id, row_number)
);

create index import_batch_rows_batch_idx on public.import_batch_rows (batch_id);

-- ---------------------------------------------------------------------------
-- Operaciones / planificación / ejecución
-- ---------------------------------------------------------------------------

create table public.operations (
  id uuid primary key default gen_random_uuid(),
  operation_date date not null,
  shift_id uuid not null references public.shifts (id),
  status public.operation_status not null default 'draft',
  import_batch_id uuid references public.import_batches (id),
  planned_by uuid references public.profiles (id),
  confirmed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (operation_date, shift_id)
);

create table public.operation_passengers (
  id uuid primary key default gen_random_uuid(),
  operation_id uuid not null references public.operations (id) on delete cascade,
  person_id uuid not null references public.persons (id),
  -- Snapshot de maestro al momento de la operación
  external_id_snapshot text not null,
  full_name_snapshot text not null,
  transport_condition_snapshot public.transport_condition not null,
  habitual_provider_id uuid references public.providers (id),
  habitual_vehicle_id uuid references public.vehicles (id),
  habitual_zone_id uuid references public.zones (id),
  habitual_sector_id uuid references public.sectors (id),
  execution_status public.passenger_execution_status not null default 'programmed',
  requires_transport boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (operation_id, person_id)
);

create index operation_passengers_op_idx on public.operation_passengers (operation_id);

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  operation_id uuid not null references public.operations (id) on delete cascade,
  vehicle_id uuid not null references public.vehicles (id),
  provider_id uuid not null references public.providers (id),
  sequence_number integer not null default 1,
  planned_capacity integer not null check (planned_capacity > 0),
  departure_time time,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (operation_id, vehicle_id, sequence_number)
);

create table public.trip_assignments (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  operation_passenger_id uuid not null references public.operation_passengers (id) on delete cascade,
  seat_order integer,
  assigned_at timestamptz not null default now(),
  unique (trip_id, operation_passenger_id),
  unique (operation_passenger_id)
);

create table public.assignment_exceptions (
  id uuid primary key default gen_random_uuid(),
  operation_id uuid not null references public.operations (id) on delete cascade,
  operation_passenger_id uuid not null references public.operation_passengers (id) on delete cascade,
  previous_provider_id uuid references public.providers (id),
  previous_vehicle_id uuid references public.vehicles (id),
  new_provider_id uuid references public.providers (id),
  new_vehicle_id uuid references public.vehicles (id),
  reason text not null,
  authorized_by uuid references public.profiles (id),
  authorized_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.incidents (
  id uuid primary key default gen_random_uuid(),
  operation_id uuid not null references public.operations (id) on delete cascade,
  trip_id uuid references public.trips (id),
  operation_passenger_id uuid references public.operation_passengers (id),
  category text not null,
  description text not null,
  reported_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Capacidad: impedir sobrecupo por viaje
-- ---------------------------------------------------------------------------

create or replace function public.enforce_trip_capacity()
returns trigger
language plpgsql
as $$
declare
  current_count integer;
  capacity integer;
begin
  select count(*) into current_count
  from public.trip_assignments
  where trip_id = new.trip_id
    and id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid);

  select planned_capacity into capacity
  from public.trips
  where id = new.trip_id;

  if current_count + 1 > capacity then
    raise exception 'Capacidad del viaje excedida (% / %)', current_count + 1, capacity
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

create trigger trip_assignments_capacity_trg
before insert or update of trip_id
on public.trip_assignments
for each row
execute function public.enforce_trip_capacity();

-- ---------------------------------------------------------------------------
-- RLS base
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.audit_log enable row level security;
alter table public.communes enable row level security;
alter table public.zones enable row level security;
alter table public.sectors enable row level security;
alter table public.addresses enable row level security;
alter table public.persons enable row level security;
alter table public.habitual_assignments enable row level security;
alter table public.providers enable row level security;
alter table public.vehicles enable row level security;
alter table public.shifts enable row level security;
alter table public.import_batches enable row level security;
alter table public.import_batch_rows enable row level security;
alter table public.operations enable row level security;
alter table public.operation_passengers enable row level security;
alter table public.trips enable row level security;
alter table public.trip_assignments enable row level security;
alter table public.assignment_exceptions enable row level security;
alter table public.incidents enable row level security;

-- Perfiles: el usuario ve el propio; admin gestiona
create policy profiles_select_own_or_admin on public.profiles
  for select using (
    auth.uid() = id
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin' and p.is_active
    )
  );

create policy profiles_update_own_or_admin on public.profiles
  for update using (
    auth.uid() = id
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin' and p.is_active
    )
  );

-- Lectura autenticada de catálogos operativos (refinar en FASE 10)
create policy authenticated_read_communes on public.communes
  for select to authenticated using (true);
create policy authenticated_read_zones on public.zones
  for select to authenticated using (true);
create policy authenticated_read_sectors on public.sectors
  for select to authenticated using (true);
create policy authenticated_read_providers on public.providers
  for select to authenticated using (true);
create policy authenticated_read_vehicles on public.vehicles
  for select to authenticated using (true);
create policy authenticated_read_shifts on public.shifts
  for select to authenticated using (true);

-- PII: addresses y persons — solo roles operativos
create policy pii_read_addresses on public.addresses
  for select to authenticated using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.is_active
        and p.role in ('admin', 'planner', 'operator')
    )
  );

create policy pii_read_persons on public.persons
  for select to authenticated using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.is_active
        and p.role in ('admin', 'planner', 'operator', 'viewer')
    )
  );

-- Escritura de planificación: admin/planner
create policy plan_write_operations on public.operations
  for all to authenticated using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_active and p.role in ('admin', 'planner')
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_active and p.role in ('admin', 'planner')
    )
  );

comment on table public.habitual_assignments is
  'Asignación habitual de persona; no se sobrescribe por capacidad de una operación.';
comment on table public.operation_passengers is
  'Pasajeros de una operación con snapshot de datos maestros.';
comment on table public.assignment_exceptions is
  'Excepciones autorizadas respecto de la asignación habitual.';
