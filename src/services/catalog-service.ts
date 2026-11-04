import { TransportCondition, VehicleStatus } from "@/domain/types";
import type {
  Commune,
  HabitualAssignment,
  Person,
  Provider,
  Sector,
  Vehicle,
  Zone,
} from "@/domain/types";
import { personDraftSchema } from "@/domain/schemas/person";
import {
  assertCanWrite,
  audit,
  getDb,
  newId,
  saveDb,
} from "@/services/local/db";

export function listPersons() {
  return getDb().persons.filter((p) => p.isActive);
}

export function upsertPerson(input: unknown): Person {
  assertCanWrite();
  const parsed = personDraftSchema.parse(input);
  const db = getDb();
  const externalId = parsed.externalId.trim().toUpperCase();
  const existing = db.persons.find(
    (p) => p.externalId.toUpperCase() === externalId,
  );

  if (existing) {
    existing.fullName = parsed.fullName.trim();
    existing.nationalId = parsed.nationalId?.trim() || null;
    existing.transportCondition = parsed.transportCondition;
    existing.phone = parsed.phone?.trim() || null;
    existing.email = parsed.email?.trim() || null;
    existing.notes = parsed.notes ?? null;
    existing.isActive = true;
    audit("person.update", "person", existing.id, { externalId });
    saveDb();
    return existing;
  }

  const person: Person = {
    id: newId(),
    externalId,
    nationalId: parsed.nationalId?.trim() || null,
    fullName: parsed.fullName.trim(),
    transportCondition: parsed.transportCondition,
    phone: parsed.phone?.trim() || null,
    email: parsed.email?.trim() || null,
    addressId: null,
    notes: parsed.notes ?? null,
    isActive: true,
  };
  db.persons.push(person);
  audit("person.create", "person", person.id, { externalId });
  saveDb();
  return person;
}

export function setHabitualAssignment(input: {
  personId: string;
  providerId?: string | null;
  vehicleId?: string | null;
  zoneId?: string | null;
  sectorId?: string | null;
  shiftCode?: string | null;
  pickupNotes?: string | null;
}): HabitualAssignment {
  assertCanWrite();
  const db = getDb();
  const person = db.persons.find((p) => p.id === input.personId);
  if (!person) throw new Error("Persona no encontrada");

  for (const item of db.habitualAssignments) {
    if (item.personId === input.personId && item.isCurrent) {
      item.isCurrent = false;
      item.validTo = new Date().toISOString().slice(0, 10);
    }
  }

  const assignment: HabitualAssignment = {
    id: newId(),
    personId: input.personId,
    providerId: input.providerId ?? null,
    vehicleId: input.vehicleId ?? null,
    zoneId: input.zoneId ?? null,
    sectorId: input.sectorId ?? null,
    shiftCode: input.shiftCode ?? null,
    pickupNotes: input.pickupNotes ?? null,
    validFrom: new Date().toISOString().slice(0, 10),
    validTo: null,
    isCurrent: true,
  };
  db.habitualAssignments.push(assignment);
  if (person.transportCondition === TransportCondition.PendingValidation) {
    person.transportCondition = TransportCondition.UsesTransport;
  }
  audit("habitual.set", "habitual_assignment", assignment.id, {
    personId: input.personId,
  });
  saveDb();
  return assignment;
}

export function listGeography() {
  const db = getDb();
  return {
    communes: db.communes,
    zones: db.zones,
    sectors: db.sectors,
    addresses: db.addresses,
  };
}

export function upsertZone(input: {
  id?: string;
  code: string;
  name: string;
}): Zone {
  assertCanWrite();
  const db = getDb();
  const code = input.code.trim().toUpperCase();
  const existing = input.id
    ? db.zones.find((z) => z.id === input.id)
    : db.zones.find((z) => z.code === code);
  if (existing) {
    existing.code = code;
    existing.name = input.name.trim();
    existing.isActive = true;
    saveDb();
    return existing;
  }
  const zone: Zone = {
    id: newId(),
    code,
    name: input.name.trim(),
    isActive: true,
  };
  db.zones.push(zone);
  audit("zone.create", "zone", zone.id, { code });
  saveDb();
  return zone;
}

export function upsertCommune(input: {
  code?: string | null;
  name: string;
  region?: string | null;
}): Commune {
  assertCanWrite();
  const db = getDb();
  const name = input.name.trim();
  const existing = db.communes.find(
    (c) => c.name.toLowerCase() === name.toLowerCase(),
  );
  if (existing) {
    existing.code = input.code?.trim() || existing.code;
    existing.region = input.region?.trim() || existing.region;
    existing.isActive = true;
    saveDb();
    return existing;
  }
  const commune: Commune = {
    id: newId(),
    code: input.code?.trim() || null,
    name,
    region: input.region?.trim() || null,
    isActive: true,
  };
  db.communes.push(commune);
  saveDb();
  return commune;
}

export function upsertSector(input: {
  zoneId: string;
  communeId?: string | null;
  code: string;
  name: string;
}): Sector {
  assertCanWrite();
  const db = getDb();
  const code = input.code.trim().toUpperCase();
  const existing = db.sectors.find(
    (s) => s.zoneId === input.zoneId && s.code === code,
  );
  if (existing) {
    existing.name = input.name.trim();
    existing.communeId = input.communeId ?? existing.communeId;
    existing.isActive = true;
    saveDb();
    return existing;
  }
  const sector: Sector = {
    id: newId(),
    zoneId: input.zoneId,
    communeId: input.communeId ?? null,
    code,
    name: input.name.trim(),
    isActive: true,
  };
  db.sectors.push(sector);
  saveDb();
  return sector;
}

export function listFleet() {
  const db = getDb();
  return { providers: db.providers, vehicles: db.vehicles };
}

export function upsertProvider(input: {
  code: string;
  name: string;
}): Provider {
  assertCanWrite();
  const db = getDb();
  const code = input.code.trim().toUpperCase();
  const existing = db.providers.find((p) => p.code === code);
  if (existing) {
    existing.name = input.name.trim();
    existing.isActive = true;
    saveDb();
    return existing;
  }
  const provider: Provider = {
    id: newId(),
    code,
    name: input.name.trim(),
    isActive: true,
  };
  db.providers.push(provider);
  audit("provider.create", "provider", provider.id, { code });
  saveDb();
  return provider;
}

export function upsertVehicle(input: {
  id?: string;
  providerId: string;
  plate: string;
  label?: string | null;
  authorizedCapacity: number;
  status?: (typeof VehicleStatus)[keyof typeof VehicleStatus];
}): Vehicle {
  assertCanWrite();
  if (input.authorizedCapacity <= 0) {
    throw new Error("La capacidad autorizada debe ser mayor a 0");
  }
  const db = getDb();
  if (!db.providers.some((p) => p.id === input.providerId)) {
    throw new Error("Proveedor no encontrado");
  }
  const plate = input.plate.trim().toUpperCase();
  const existing = input.id
    ? db.vehicles.find((v) => v.id === input.id)
    : db.vehicles.find((v) => v.plate === plate);

  if (existing) {
    existing.providerId = input.providerId;
    existing.plate = plate;
    existing.label = input.label ?? existing.label;
    existing.authorizedCapacity = input.authorizedCapacity;
    existing.status = input.status ?? existing.status;
    existing.isActive = true;
    audit("vehicle.update", "vehicle", existing.id, { plate });
    saveDb();
    return existing;
  }

  const vehicle: Vehicle = {
    id: newId(),
    providerId: input.providerId,
    plate,
    label: input.label ?? null,
    authorizedCapacity: input.authorizedCapacity,
    status: input.status ?? VehicleStatus.Available,
    isActive: true,
  };
  db.vehicles.push(vehicle);
  audit("vehicle.create", "vehicle", vehicle.id, { plate });
  saveDb();
  return vehicle;
}

export function getDashboardStats() {
  const db = getDb();
  const personsActive = db.persons.filter((p) => p.isActive);
  return {
    persons: personsActive.length,
    usesTransport: personsActive.filter(
      (p) => p.transportCondition === TransportCondition.UsesTransport,
    ).length,
    vehiclesAvailable: db.vehicles.filter(
      (v) => v.isActive && v.status === VehicleStatus.Available,
    ).length,
    totalCapacity: db.vehicles
      .filter((v) => v.isActive && v.status === VehicleStatus.Available)
      .reduce((sum, v) => sum + v.authorizedCapacity, 0),
    operations: db.operations.length,
    openOperations: db.operations.filter(
      (o) => o.status !== "completed" && o.status !== "cancelled",
    ).length,
    importBatches: db.importBatches.length,
    exceptions: db.exceptions.length,
    incidents: db.incidents.length,
    auditRecent: db.auditLog.slice(0, 8),
  };
}
