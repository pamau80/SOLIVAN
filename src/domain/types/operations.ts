import type {
  OperationStatus,
  PassengerExecutionStatus,
  TransportCondition,
} from "./enums";
import type { UUID } from "./entities";

export interface Address {
  id: UUID;
  streetLine: string;
  reference: string | null;
  communeId: UUID | null;
  sectorId: UUID | null;
  zoneId: UUID | null;
}

export interface ImportBatch {
  id: UUID;
  sourceFilename: string;
  status: "pending" | "validated" | "imported" | "rejected" | "partial";
  rowCount: number;
  errorCount: number;
  mapping: Record<string, string>;
  summary: Record<string, unknown>;
  createdAt: string;
  completedAt: string | null;
}

export interface ImportBatchRow {
  id: UUID;
  batchId: UUID;
  rowNumber: number;
  rawPayload: Record<string, unknown>;
  externalId: string | null;
  validationErrors: string[];
  personId: UUID | null;
  isDuplicate: boolean;
  isNewPerson: boolean;
}

export interface TripAssignment {
  id: UUID;
  tripId: UUID;
  operationPassengerId: UUID;
  seatOrder: number | null;
  assignedAt: string;
}

export interface AssignmentException {
  id: UUID;
  operationId: UUID;
  operationPassengerId: UUID;
  previousProviderId: UUID | null;
  previousVehicleId: UUID | null;
  newProviderId: UUID | null;
  newVehicleId: UUID | null;
  reason: string;
  authorizedBy: string;
  authorizedAt: string;
}

export interface Incident {
  id: UUID;
  operationId: UUID;
  tripId: UUID | null;
  operationPassengerId: UUID | null;
  category: string;
  description: string;
  reportedBy: string;
  createdAt: string;
}

export interface AuditEntry {
  id: UUID;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string | null;
  payload: Record<string, unknown>;
  createdAt: string;
}

export type {
  OperationStatus,
  PassengerExecutionStatus,
  TransportCondition,
};
