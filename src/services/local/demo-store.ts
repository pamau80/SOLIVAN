import { TransportCondition, VehicleStatus } from "@/domain/types";
import type {
  HabitualAssignment,
  Person,
  Provider,
  Shift,
  Vehicle,
  Zone,
} from "@/domain/types";

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

const zoneNorte: Zone = {
  id: "22222222-2222-2222-2222-222222222201",
  code: "ZN",
  name: "Zona Norte",
  isActive: true,
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
    phone: null,
    email: null,
    addressId: null,
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
    sectorId: null,
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
    sectorId: null,
    shiftCode: "A",
    pickupNotes: null,
    validFrom: "2026-01-01",
    validTo: null,
    isCurrent: true,
  },
];

const shifts: Shift[] = [
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
];

/** Datos de demostración solo para modo local (sin Supabase). */
export const demoStore = {
  providers: [providerA, providerB],
  vehicles,
  zones: [zoneNorte],
  persons,
  habitualAssignments: habitual,
  shifts,
};
