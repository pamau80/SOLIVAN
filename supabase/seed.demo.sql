-- Seed demo alineado con el store local (IDs fijos). Seguro re-ejecutar.

insert into public.providers (id, code, name, is_active)
values
  ('11111111-1111-1111-1111-111111111101', 'PROV-A', 'Transportes Andes', true),
  ('11111111-1111-1111-1111-111111111102', 'PROV-B', 'Buses Pacífico', true)
on conflict (code) do update set name = excluded.name, is_active = true;

insert into public.communes (id, code, name, region, is_active)
values
  ('77777777-7777-7777-7777-777777777701', '13101', 'Santiago', 'Metropolitana', true)
on conflict (name) do update set code = excluded.code, region = excluded.region, is_active = true;

insert into public.zones (id, code, name, is_active)
values
  ('22222222-2222-2222-2222-222222222201', 'ZN', 'Zona Norte', true),
  ('22222222-2222-2222-2222-222222222202', 'ZS', 'Zona Sur', true)
on conflict (code) do update set name = excluded.name, is_active = true;

insert into public.sectors (id, zone_id, commune_id, code, name, is_active)
values
  (
    '88888888-8888-8888-8888-888888888801',
    '22222222-2222-2222-2222-222222222201',
    '77777777-7777-7777-7777-777777777701',
    'ZN-01',
    'Sector Plaza',
    true
  )
on conflict (zone_id, code) do update set name = excluded.name, is_active = true;

insert into public.addresses (id, street_line, reference, commune_id, sector_id, zone_id)
values
  (
    '99999999-9999-9999-9999-999999999901',
    'Av. Independencia 1200',
    'Paradero Plaza',
    '77777777-7777-7777-7777-777777777701',
    '88888888-8888-8888-8888-888888888801',
    '22222222-2222-2222-2222-222222222201'
  )
on conflict (id) do nothing;

insert into public.vehicles (
  id, provider_id, plate, label, authorized_capacity, status, is_active
)
values
  ('33333333-3333-3333-3333-333333333301', '11111111-1111-1111-1111-111111111101', 'ABCD12', 'Van 15', 15, 'available', true),
  ('33333333-3333-3333-3333-333333333302', '11111111-1111-1111-1111-111111111101', 'EFGH34', 'Van 12', 12, 'available', true),
  ('33333333-3333-3333-3333-333333333303', '11111111-1111-1111-1111-111111111102', 'IJKL56', 'Bus 25', 25, 'available', true)
on conflict (plate) do update set
  provider_id = excluded.provider_id,
  label = excluded.label,
  authorized_capacity = excluded.authorized_capacity,
  status = excluded.status,
  is_active = true;

insert into public.persons (
  id, external_id, national_id, full_name, transport_condition, phone, email, address_id, is_active
)
values
  ('44444444-4444-4444-4444-444444444401', 'TRB-1001', '12.345.678-9', 'Ana Pérez', 'uses_transport', '+56 9 1111 1111', 'ana@example.com', '99999999-9999-9999-9999-999999999901', true),
  ('44444444-4444-4444-4444-444444444402', 'TRB-1002', '11.222.333-4', 'Bruno Soto', 'uses_transport', null, null, null, true),
  ('44444444-4444-4444-4444-444444444403', 'TRB-1003', null, 'Carla Díaz', 'no_transport', null, null, null, true)
on conflict (external_id) do update set
  full_name = excluded.full_name,
  transport_condition = excluded.transport_condition,
  is_active = true;

insert into public.shifts (id, code, name, start_time, end_time, is_active)
values
  ('66666666-6666-6666-6666-666666666601', 'A', 'Turno A', '06:30', '15:30', true),
  ('66666666-6666-6666-6666-666666666602', 'B', 'Turno B', '14:30', '23:30', true)
on conflict (code) do update set
  name = excluded.name,
  start_time = excluded.start_time,
  end_time = excluded.end_time,
  is_active = true;

-- Habituales: cierra vigentes y recrea demo
update public.habitual_assignments
set is_current = false, valid_to = current_date
where person_id in (
  '44444444-4444-4444-4444-444444444401',
  '44444444-4444-4444-4444-444444444402'
)
and is_current;

insert into public.habitual_assignments (
  id, person_id, provider_id, vehicle_id, zone_id, sector_id, shift_code, pickup_notes, valid_from, is_current
)
values
  (
    '55555555-5555-5555-5555-555555555501',
    '44444444-4444-4444-4444-444444444401',
    '11111111-1111-1111-1111-111111111101',
    '33333333-3333-3333-3333-333333333301',
    '22222222-2222-2222-2222-222222222201',
    '88888888-8888-8888-8888-888888888801',
    'A',
    'Paradero Plaza',
    '2026-01-01',
    true
  ),
  (
    '55555555-5555-5555-5555-555555555502',
    '44444444-4444-4444-4444-444444444402',
    '11111111-1111-1111-1111-111111111101',
    '33333333-3333-3333-3333-333333333301',
    '22222222-2222-2222-2222-222222222201',
    '88888888-8888-8888-8888-888888888801',
    'A',
    null,
    '2026-01-01',
    true
  )
on conflict (id) do nothing;
