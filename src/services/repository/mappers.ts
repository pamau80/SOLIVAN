import type {
  HabitualAssignment,
  Person,
  Provider,
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
