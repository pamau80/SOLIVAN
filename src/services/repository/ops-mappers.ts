import type {
  AssignmentException,
  ImportBatch,
  ImportBatchRow,
  Incident,
  Operation,
  OperationPassenger,
  Shift,
  Trip,
  TripAssignment,
} from "@/domain/types";
import {
  OperationStatus,
  PassengerExecutionStatus,
} from "@/domain/types";

export function mapShift(row: Record<string, unknown>): Shift {
  return {
    id: String(row.id),
    code: String(row.code),
    name: String(row.name),
    startTime: String(row.start_time).slice(0, 5),
    endTime: String(row.end_time).slice(0, 5),
    isActive: Boolean(row.is_active ?? true),
  };
}

export function mapOperation(row: Record<string, unknown>): Operation {
  return {
    id: String(row.id),
    operationDate: String(row.operation_date),
    shiftId: String(row.shift_id),
    status: (row.status as Operation["status"]) ?? OperationStatus.Draft,
    importBatchId: (row.import_batch_id as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    confirmedAt: (row.confirmed_at as string | null) ?? null,
  };
}

export function mapPassenger(row: Record<string, unknown>): OperationPassenger {
  return {
    id: String(row.id),
    operationId: String(row.operation_id),
    personId: String(row.person_id),
    externalIdSnapshot: String(row.external_id_snapshot),
    fullNameSnapshot: String(row.full_name_snapshot),
    transportConditionSnapshot:
      row.transport_condition_snapshot as OperationPassenger["transportConditionSnapshot"],
    habitualProviderId: (row.habitual_provider_id as string | null) ?? null,
    habitualVehicleId: (row.habitual_vehicle_id as string | null) ?? null,
    habitualZoneId: (row.habitual_zone_id as string | null) ?? null,
    habitualSectorId: (row.habitual_sector_id as string | null) ?? null,
    executionStatus:
      (row.execution_status as OperationPassenger["executionStatus"]) ??
      PassengerExecutionStatus.Programmed,
    requiresTransport: Boolean(row.requires_transport ?? true),
  };
}

export function mapTrip(row: Record<string, unknown>): Trip {
  return {
    id: String(row.id),
    operationId: String(row.operation_id),
    vehicleId: String(row.vehicle_id),
    providerId: String(row.provider_id),
    sequenceNumber: Number(row.sequence_number),
    plannedCapacity: Number(row.planned_capacity),
    departureTime: row.departure_time
      ? String(row.departure_time).slice(0, 5)
      : null,
  };
}

export function mapAssignment(row: Record<string, unknown>): TripAssignment {
  return {
    id: String(row.id),
    tripId: String(row.trip_id),
    operationPassengerId: String(row.operation_passenger_id),
    seatOrder: (row.seat_order as number | null) ?? null,
    assignedAt: String(row.assigned_at),
  };
}

export function mapException(row: Record<string, unknown>): AssignmentException {
  return {
    id: String(row.id),
    operationId: String(row.operation_id),
    operationPassengerId: String(row.operation_passenger_id),
    previousProviderId: (row.previous_provider_id as string | null) ?? null,
    previousVehicleId: (row.previous_vehicle_id as string | null) ?? null,
    newProviderId: (row.new_provider_id as string | null) ?? null,
    newVehicleId: (row.new_vehicle_id as string | null) ?? null,
    reason: String(row.reason),
    authorizedBy: String(row.authorized_by ?? ""),
    authorizedAt: String(row.authorized_at),
  };
}

export function mapIncident(row: Record<string, unknown>): Incident {
  return {
    id: String(row.id),
    operationId: String(row.operation_id),
    tripId: (row.trip_id as string | null) ?? null,
    operationPassengerId: (row.operation_passenger_id as string | null) ?? null,
    category: String(row.category),
    description: String(row.description),
    reportedBy: String(row.reported_by ?? ""),
    createdAt: String(row.created_at),
  };
}

export function mapImportBatch(row: Record<string, unknown>): ImportBatch {
  return {
    id: String(row.id),
    sourceFilename: String(row.source_filename),
    status: row.status as ImportBatch["status"],
    rowCount: Number(row.row_count ?? 0),
    errorCount: Number(row.error_count ?? 0),
    mapping: (row.mapping as Record<string, string>) ?? {},
    summary: (row.summary as Record<string, unknown>) ?? {},
    createdAt: String(row.created_at),
    completedAt: (row.completed_at as string | null) ?? null,
  };
}

export function mapImportBatchRow(row: Record<string, unknown>): ImportBatchRow {
  return {
    id: String(row.id),
    batchId: String(row.batch_id),
    rowNumber: Number(row.row_number),
    rawPayload: (row.raw_payload as Record<string, unknown>) ?? {},
    externalId: (row.external_id as string | null) ?? null,
    validationErrors: (row.validation_errors as string[]) ?? [],
    personId: (row.person_id as string | null) ?? null,
    isDuplicate: Boolean(row.is_duplicate),
    isNewPerson: Boolean(row.is_new_person),
  };
}
