import type {
  AppRole,
  OperationStatus,
  PassengerExecutionStatus,
  TransportCondition,
  VehicleStatus,
} from "./enums";

export type UUID = string;

export interface Person {
  id: UUID;
  externalId: string;
  nationalId: string | null;
  fullName: string;
  transportCondition: TransportCondition;
  phone: string | null;
  email: string | null;
  addressId: UUID | null;
  notes: string | null;
  isActive: boolean;
}

export interface HabitualAssignment {
  id: UUID;
  personId: UUID;
  providerId: UUID | null;
  vehicleId: UUID | null;
  zoneId: UUID | null;
  sectorId: UUID | null;
  shiftCode: string | null;
  pickupNotes: string | null;
  validFrom: string;
  validTo: string | null;
  isCurrent: boolean;
}

export interface Provider {
  id: UUID;
  code: string;
  name: string;
  isActive: boolean;
}

export interface Vehicle {
  id: UUID;
  providerId: UUID;
  plate: string;
  label: string | null;
  authorizedCapacity: number;
  status: VehicleStatus;
  isActive: boolean;
}

export interface Zone {
  id: UUID;
  code: string;
  name: string;
  isActive: boolean;
}

export interface Commune {
  id: UUID;
  code: string | null;
  name: string;
  region: string | null;
  isActive: boolean;
}

export interface Sector {
  id: UUID;
  zoneId: UUID;
  communeId: UUID | null;
  code: string;
  name: string;
  isActive: boolean;
}

export interface Shift {
  id: UUID;
  code: string;
  name: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface Operation {
  id: UUID;
  operationDate: string;
  shiftId: UUID;
  status: OperationStatus;
  notes: string | null;
}

export interface OperationPassenger {
  id: UUID;
  operationId: UUID;
  personId: UUID;
  externalIdSnapshot: string;
  fullNameSnapshot: string;
  transportConditionSnapshot: TransportCondition;
  habitualProviderId: UUID | null;
  habitualVehicleId: UUID | null;
  habitualZoneId: UUID | null;
  habitualSectorId: UUID | null;
  executionStatus: PassengerExecutionStatus;
  requiresTransport: boolean;
}

export interface Trip {
  id: UUID;
  operationId: UUID;
  vehicleId: UUID;
  providerId: UUID;
  sequenceNumber: number;
  plannedCapacity: number;
  departureTime: string | null;
}

export interface Profile {
  id: UUID;
  email: string;
  fullName: string;
  role: AppRole;
  isActive: boolean;
}
