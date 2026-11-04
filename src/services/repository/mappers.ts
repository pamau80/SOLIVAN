import type {
  Address,
  Commune,
  HabitualAssignment,
  Person,
  Provider,
  Sector,
  Vehicle,
  Zone,
} from "@/domain/types";
import {
  TransportCondition,
  VehicleStatus,
} from "@/domain/types";

/** Filas snake_case de Supabase → dominio camelCase */

export function mapPerson(row: Record<string, unknown>): Person {
  return {
    id: String(row.id),
    externalId: String(row.external_id),
    nationalId: (row.national_id as string | null) ?? null,
    fullName: String(row.full_name),
    transportCondition:
      (row.transport_condition as Person["transportCondition"]) ??
      TransportCondition.PendingValidation,
    phone: (row.phone as string | null) ?? null,
    email: (row.email as string | null) ?? null,
    addressId: (row.address_id as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    isActive: Boolean(row.is_active ?? true),
  };
}

export function mapHabitual(row: Record<string, unknown>): HabitualAssignment {
  return {
    id: String(row.id),
    personId: String(row.person_id),
    providerId: (row.provider_id as string | null) ?? null,
    vehicleId: (row.vehicle_id as string | null) ?? null,
    zoneId: (row.zone_id as string | null) ?? null,
    sectorId: (row.sector_id as string | null) ?? null,
    shiftCode: (row.shift_code as string | null) ?? null,
    pickupNotes: (row.pickup_notes as string | null) ?? null,
    validFrom: String(row.valid_from),
    validTo: (row.valid_to as string | null) ?? null,
    isCurrent: Boolean(row.is_current ?? true),
  };
}

export function mapProvider(row: Record<string, unknown>): Provider {
  return {
    id: String(row.id),
    code: String(row.code),
    name: String(row.name),
    isActive: Boolean(row.is_active ?? true),
  };
}

export function mapVehicle(row: Record<string, unknown>): Vehicle {
  return {
    id: String(row.id),
    providerId: String(row.provider_id),
    plate: String(row.plate),
    label: (row.label as string | null) ?? null,
    authorizedCapacity: Number(row.authorized_capacity),
    status:
      (row.status as Vehicle["status"]) ?? VehicleStatus.Available,
    isActive: Boolean(row.is_active ?? true),
  };
}

export function mapZone(row: Record<string, unknown>): Zone {
  return {
    id: String(row.id),
    code: String(row.code),
    name: String(row.name),
    isActive: Boolean(row.is_active ?? true),
  };
}

export function mapCommune(row: Record<string, unknown>): Commune {
  return {
    id: String(row.id),
    code: (row.code as string | null) ?? null,
    name: String(row.name),
    region: (row.region as string | null) ?? null,
    isActive: Boolean(row.is_active ?? true),
  };
}

export function mapSector(row: Record<string, unknown>): Sector {
  return {
    id: String(row.id),
    zoneId: String(row.zone_id),
    communeId: (row.commune_id as string | null) ?? null,
    code: String(row.code),
    name: String(row.name),
    isActive: Boolean(row.is_active ?? true),
  };
}

export function mapAddress(row: Record<string, unknown>): Address {
  return {
    id: String(row.id),
    streetLine: String(row.street_line),
    reference: (row.reference as string | null) ?? null,
    communeId: (row.commune_id as string | null) ?? null,
    sectorId: (row.sector_id as string | null) ?? null,
    zoneId: (row.zone_id as string | null) ?? null,
  };
}

export function personToRow(person: Partial<Person>) {
  return {
    external_id: person.externalId,
    national_id: person.nationalId,
    full_name: person.fullName,
    transport_condition: person.transportCondition,
    phone: person.phone,
    email: person.email,
    address_id: person.addressId,
    notes: person.notes,
    is_active: person.isActive ?? true,
  };
}

export function habitualToRow(item: HabitualAssignment) {
  return {
    id: item.id,
    person_id: item.personId,
    provider_id: item.providerId,
    vehicle_id: item.vehicleId,
    zone_id: item.zoneId,
    sector_id: item.sectorId,
    shift_code: item.shiftCode,
    pickup_notes: item.pickupNotes,
    valid_from: item.validFrom,
    valid_to: item.validTo,
    is_current: item.isCurrent,
  };
}

export function providerToRow(provider: Provider) {
  return {
    id: provider.id,
    code: provider.code,
    name: provider.name,
    is_active: provider.isActive,
  };
}

export function vehicleToRow(vehicle: Vehicle) {
  return {
    id: vehicle.id,
    provider_id: vehicle.providerId,
    plate: vehicle.plate,
    label: vehicle.label,
    authorized_capacity: vehicle.authorizedCapacity,
    status: vehicle.status,
    is_active: vehicle.isActive,
  };
}

export function zoneToRow(zone: Zone) {
  return {
    id: zone.id,
    code: zone.code,
    name: zone.name,
    is_active: zone.isActive,
  };
}

export function communeToRow(commune: Commune) {
  return {
    id: commune.id,
    code: commune.code,
    name: commune.name,
    region: commune.region,
    is_active: commune.isActive,
  };
}

export function sectorToRow(sector: Sector) {
  return {
    id: sector.id,
    zone_id: sector.zoneId,
    commune_id: sector.communeId,
    code: sector.code,
    name: sector.name,
    is_active: sector.isActive,
  };
}

export function addressToRow(address: Address) {
  return {
    id: address.id,
    street_line: address.streetLine,
    reference: address.reference,
    commune_id: address.communeId,
    sector_id: address.sectorId,
    zone_id: address.zoneId,
  };
}
