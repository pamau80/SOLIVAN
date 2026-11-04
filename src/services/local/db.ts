import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import {
  AppRole,
  OperationStatus,
  PassengerExecutionStatus,
  TransportCondition,
  VehicleStatus,
} from "@/domain/types";
import type {
  Address,
  AssignmentException,
  AuditEntry,
  Commune,
  HabitualAssignment,
  ImportBatch,
  ImportBatchRow,
  Incident,
  Operation,
  OperationPassenger,
  Person,
  Profile,
  Provider,
  Sector,
  Shift,
  Trip,
  TripAssignment,
  Vehicle,
  Zone,
} from "@/domain/types";

export type LocalDatabase = {
  communes: Commune[];
  zones: Zone[];
  sectors: Sector[];
  addresses: Address[];
  persons: Person[];
  habitualAssignments: HabitualAssignment[];
  providers: Provider[];
  vehicles: Vehicle[];
  shifts: Shift[];
  importBatches: ImportBatch[];
  importBatchRows: ImportBatchRow[];
  operations: Operation[];
  operationPassengers: OperationPassenger[];
  trips: Trip[];
  tripAssignments: TripAssignment[];
  exceptions: AssignmentException[];
  incidents: Incident[];
  profiles: Profile[];
  auditLog: AuditEntry[];
  session: { userId: string; role: (typeof AppRole)[keyof typeof AppRole] };
};

// Fuera de la raíz del proyecto para no disparar HMR de Next al persistir.
const DATA_DIR =
  process.env.SOLIVAN_DATA_DIR ?? path.join("/tmp", "solivan-data");
const DATA_FILE =
  process.env.SOLIVAN_DATA_FILE ?? path.join(DATA_DIR, "solivan-local.json");

function seed(): LocalDatabase {
  const providerA: Provider = {
    id: "11111111-1111-1111-1111-111111111101",
    code: "PROV-A",
    name: "Transportes Andes",
    isActive: true,
  };
  const providerB: Provider = {
    id: "11111111-1111-1111-1111-111111111102",
    code: "PROV-B",
    name: "Buses Pacífico",
    isActive: true,
  };

  const commune: Commune = {
    id: "77777777-7777-7777-7777-777777777701",
    code: "13101",
    name: "Santiago",
    region: "Metropolitana",
    isActive: true,
  };

  const zoneNorte: Zone = {
    id: "22222222-2222-2222-2222-222222222201",
    code: "ZN",
    name: "Zona Norte",
    isActive: true,
  };
  const zoneSur: Zone = {
    id: "22222222-2222-2222-2222-222222222202",
    code: "ZS",
    name: "Zona Sur",
    isActive: true,
  };

  const sector: Sector = {
    id: "88888888-8888-8888-8888-888888888801",
    zoneId: zoneNorte.id,
    communeId: commune.id,
    code: "ZN-01",
    name: "Sector Plaza",
    isActive: true,
  };

  const address: Address = {
    id: "99999999-9999-9999-9999-999999999901",
    streetLine: "Av. Independencia 1200",
    reference: "Paradero Plaza",
    communeId: commune.id,
    sectorId: sector.id,
    zoneId: zoneNorte.id,
  };

  const vehicles: Vehicle[] = [
    {
      id: "33333333-3333-3333-3333-333333333301",
      providerId: providerA.id,
      plate: "ABCD12",
      label: "Van 15",
      authorizedCapacity: 15,
      status: VehicleStatus.Available,
      isActive: true,
    },
    {
      id: "33333333-3333-3333-3333-333333333302",
      providerId: providerA.id,
      plate: "EFGH34",
      label: "Van 12",
      authorizedCapacity: 12,
      status: VehicleStatus.Available,
      isActive: true,
    },
    {
      id: "33333333-3333-3333-3333-333333333303",
      providerId: providerB.id,
      plate: "IJKL56",
      label: "Bus 25",
      authorizedCapacity: 25,
      status: VehicleStatus.Available,
      isActive: true,
    },
  ];

  const persons: Person[] = [
    {
      id: "44444444-4444-4444-4444-444444444401",
      externalId: "TRB-1001",
      nationalId: "12.345.678-9",
      fullName: "Ana Pérez",
      transportCondition: TransportCondition.UsesTransport,
      phone: "+56 9 1111 1111",
      email: "ana@example.com",
      addressId: address.id,
      notes: null,
      isActive: true,
    },
    {
      id: "44444444-4444-4444-4444-444444444402",
      externalId: "TRB-1002",
      nationalId: "11.222.333-4",
      fullName: "Bruno Soto",
      transportCondition: TransportCondition.UsesTransport,
      phone: null,
      email: null,
      addressId: null,
      notes: null,
      isActive: true,
    },
    {
      id: "44444444-4444-4444-4444-444444444403",
      externalId: "TRB-1003",
      nationalId: null,
      fullName: "Carla Díaz",
      transportCondition: TransportCondition.NoTransport,
      phone: null,
      email: null,
      addressId: null,
      notes: null,
      isActive: true,
    },
  ];

  const habitual: HabitualAssignment[] = [
    {
      id: "55555555-5555-5555-5555-555555555501",
      personId: persons[0].id,
      providerId: providerA.id,
      vehicleId: vehicles[0].id,
      zoneId: zoneNorte.id,
      sectorId: sector.id,
      shiftCode: "A",
      pickupNotes: "Paradero Plaza",
      validFrom: "2026-01-01",
      validTo: null,
      isCurrent: true,
    },
    {
      id: "55555555-5555-5555-5555-555555555502",
      personId: persons[1].id,
      providerId: providerA.id,
      vehicleId: vehicles[0].id,
      zoneId: zoneNorte.id,
      sectorId: sector.id,
      shiftCode: "A",
      pickupNotes: null,
      validFrom: "2026-01-01",
      validTo: null,
      isCurrent: true,
    },
  ];

  const profiles: Profile[] = [
    {
      id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1",
      email: "planificador@solivan.local",
      fullName: "Planificador Demo",
      role: AppRole.Planner,
      isActive: true,
    },
    {
      id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2",
      email: "admin@solivan.local",
      fullName: "Administrador Demo",
      role: AppRole.Admin,
      isActive: true,
    },
    {
      id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3",
      email: "operador@solivan.local",
      fullName: "Operador Demo",
      role: AppRole.Operator,
      isActive: true,
    },
    {
      id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4",
      email: "visor@solivan.local",
      fullName: "Visor Demo",
      role: AppRole.Viewer,
      isActive: true,
    },
  ];

  const profile = profiles[0];

  return {
    communes: [commune],
    zones: [zoneNorte, zoneSur],
    sectors: [sector],
    addresses: [address],
    persons,
    habitualAssignments: habitual,
    providers: [providerA, providerB],
    vehicles,
    shifts: [
      {
        id: "66666666-6666-6666-6666-666666666601",
        code: "A",
        name: "Turno A",
        startTime: "06:30",
        endTime: "15:30",
        isActive: true,
      },
      {
        id: "66666666-6666-6666-6666-666666666602",
        code: "B",
        name: "Turno B",
        startTime: "14:30",
        endTime: "23:30",
        isActive: true,
      },
    ],
    importBatches: [],
    importBatchRows: [],
    operations: [],
    operationPassengers: [],
    trips: [],
    tripAssignments: [],
    exceptions: [],
    incidents: [],
    profiles,
    auditLog: [],
    session: { userId: profile.id, role: profile.role },
  };
}

declare global {
  var __solivanDb: LocalDatabase | undefined;
}

function loadFromDisk(): LocalDatabase | null {
  try {
    if (!existsSync(DATA_FILE)) return null;
    const raw = readFileSync(DATA_FILE, "utf8");
    return JSON.parse(raw) as LocalDatabase;
  } catch {
    return null;
  }
}

function persist(db: LocalDatabase) {
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), "utf8");
}

export function getDb(): LocalDatabase {
  if (!globalThis.__solivanDb) {
    globalThis.__solivanDb = loadFromDisk() ?? seed();
    persist(globalThis.__solivanDb);
  }
  return globalThis.__solivanDb;
}

export function saveDb() {
  persist(getDb());
}

export function resetDb() {
  globalThis.__solivanDb = seed();
  persist(globalThis.__solivanDb);
  return globalThis.__solivanDb;
}

export function newId(): string {
  return crypto.randomUUID();
}

export function audit(
  action: string,
  entityType: string,
  entityId: string | null,
  payload: Record<string, unknown> = {},
) {
  const db = getDb();
  db.auditLog.unshift({
    id: newId(),
    actorId: db.session.userId,
    action,
    entityType,
    entityId,
    payload,
    createdAt: new Date().toISOString(),
  });
  db.auditLog = db.auditLog.slice(0, 500);
  saveDb();
}

export function assertCanWrite() {
  const role = getDb().session.role;
  if (role === AppRole.Viewer) {
    throw new Error("Rol viewer: solo lectura");
  }
}

export {
  OperationStatus,
  PassengerExecutionStatus,
  TransportCondition,
  VehicleStatus,
  AppRole,
};
