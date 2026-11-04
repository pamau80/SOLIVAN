import {
  authorizeException,
  planOperation,
} from "@/domain/rules";
import {
  OperationStatus,
  PassengerExecutionStatus,
  TransportCondition,
} from "@/domain/types";
import type {
  ImportBatch,
  Operation,
  OperationPassenger,
  Trip,
} from "@/domain/types";
import {
  assertCanWrite,
  audit,
  getDb,
  newId,
  saveDb,
} from "@/services/local/db";

function currentHabitualMap() {
  const map = new Map(
    getDb()
      .habitualAssignments.filter((h) => h.isCurrent)
      .map((h) => [h.personId, h] as const),
  );
  return map;
}

export function previewImport(input: {
  filename: string;
  mapping: Record<string, string>;
  rows: Record<string, unknown>[];
}) {
  const db = getDb();
  const mapped = input.rows.map((row, index) => {
    const get = (field: string) => {
      const col = input.mapping[field];
      if (!col) return "";
      const value = row[col];
      return value == null ? "" : String(value).trim();
    };
    return {
      rowNumber: index + 1,
      externalId: get("externalId"),
      nationalId: get("nationalId") || null,
      fullName: get("fullName"),
      transportCondition: (() => {
        const raw = get("transportCondition").toLowerCase();
        if (!raw) return null;
        if (["si", "sí", "yes", "1", "uses_transport", "usa"].includes(raw)) {
          return TransportCondition.UsesTransport;
        }
        if (["no", "0", "no_transport"].includes(raw)) {
          return TransportCondition.NoTransport;
        }
        return TransportCondition.PendingValidation;
      })(),
      raw: row,
    };
  });

  const identified = planOperation({
    date: new Date().toISOString().slice(0, 10),
    shiftCode: "A",
    rows: mapped.map((m) => ({
      rowNumber: m.rowNumber,
      externalId: m.externalId,
      nationalId: m.nationalId,
      fullName: m.fullName,
      transportCondition: m.transportCondition,
    })),
    existingPersons: db.persons,
    habitualByPersonId: currentHabitualMap(),
    vehicles: db.vehicles,
  }).identified;

  return {
    filename: input.filename,
    mapping: input.mapping,
    rowCount: mapped.length,
    preview: identified.map((item, idx) => ({
      ...item,
      raw: mapped[idx]?.raw ?? {},
    })),
    errorCount: identified.filter((i) => i.issues.length > 0).length,
    newCount: identified.filter((i) => i.isNewPerson).length,
    duplicateCount: identified.filter((i) => i.isDuplicateInBatch).length,
  };
}

export function commitImport(input: {
  filename: string;
  mapping: Record<string, string>;
  rows: Record<string, unknown>[];
  createMissingPersons?: boolean;
}): ImportBatch {
  assertCanWrite();
  const preview = previewImport(input);
  const db = getDb();
  const batchId = newId();
  const batch: ImportBatch = {
    id: batchId,
    sourceFilename: input.filename,
    status: "imported",
    rowCount: preview.rowCount,
    errorCount: preview.errorCount,
    mapping: input.mapping,
    summary: {
      newCount: preview.newCount,
      duplicateCount: preview.duplicateCount,
    },
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  };

  for (const item of preview.preview) {
    let personId: string | null = item.matchedPerson?.id ?? null;
    if (
      !personId &&
      item.isNewPerson &&
      input.createMissingPersons !== false &&
      item.externalId &&
      item.fullName
    ) {
      const person = {
        id: newId(),
        externalId: item.externalId,
        nationalId: null,
        fullName: item.fullName,
        transportCondition: item.transportCondition,
        phone: null,
        email: null,
        addressId: null,
        notes: null,
        isActive: true,
      };
      db.persons.push(person);
      personId = person.id;
    }

    db.importBatchRows.push({
      id: newId(),
      batchId,
      rowNumber: item.rowNumber,
      rawPayload: (item.raw as Record<string, unknown>) ?? {},
      externalId: item.externalId || null,
      validationErrors: item.issues.map((i) => i.message),
      personId,
      isDuplicate: item.isDuplicateInBatch,
      isNewPerson: item.isNewPerson,
    });
  }

  if (preview.errorCount > 0 && preview.errorCount < preview.rowCount) {
    batch.status = "partial";
  } else if (preview.errorCount === preview.rowCount && preview.rowCount > 0) {
    batch.status = "rejected";
  }

  db.importBatches.unshift(batch);
  audit("import.commit", "import_batch", batchId, {
    filename: input.filename,
    rowCount: batch.rowCount,
  });
  saveDb();
  return batch;
}

export function createPlannedOperation(input: {
  date: string;
  shiftCode: string;
  personExternalIds?: string[];
}): {
  operation: Operation;
  plan: ReturnType<typeof planOperation>;
} {
  assertCanWrite();
  const db = getDb();
  const shift = db.shifts.find((s) => s.code === input.shiftCode);
  if (!shift) throw new Error("Turno no encontrado");

  const sourcePersons = db.persons.filter((p) => {
    if (!p.isActive) return false;
    if (input.personExternalIds?.length) {
      return input.personExternalIds.includes(p.externalId);
    }
    return p.transportCondition === TransportCondition.UsesTransport;
  });

  const rows = sourcePersons.map((p, index) => ({
    rowNumber: index + 1,
    externalId: p.externalId,
    nationalId: p.nationalId,
    fullName: p.fullName,
    transportCondition: p.transportCondition,
  }));

  const plan = planOperation({
    date: input.date,
    shiftCode: input.shiftCode,
    rows,
    existingPersons: db.persons,
    habitualByPersonId: currentHabitualMap(),
    vehicles: db.vehicles,
  });

  const existing = db.operations.find(
    (o) => o.operationDate === input.date && o.shiftId === shift.id,
  );
  if (existing) {
    db.tripAssignments = db.tripAssignments.filter(
      (ta) => !db.trips.some((t) => t.operationId === existing.id && t.id === ta.tripId),
    );
    db.trips = db.trips.filter((t) => t.operationId !== existing.id);
    db.operationPassengers = db.operationPassengers.filter(
      (op) => op.operationId !== existing.id,
    );
    db.operations = db.operations.filter((o) => o.id !== existing.id);
  }

  const operation: Operation = {
    id: newId(),
    operationDate: input.date,
    shiftId: shift.id,
    status: OperationStatus.Planned,
    importBatchId: null,
    notes: null,
    confirmedAt: null,
  };
  db.operations.unshift(operation);

  const passengerByExternal = new Map<string, OperationPassenger>();
  for (const item of plan.eligible) {
    const person = item.matchedPerson;
    if (!person) continue;
    const habitual = item.habitualAssignment;
    const opPassenger: OperationPassenger = {
      id: newId(),
      operationId: operation.id,
      personId: person.id,
      externalIdSnapshot: person.externalId,
      fullNameSnapshot: person.fullName,
      transportConditionSnapshot: person.transportCondition,
      habitualProviderId: habitual?.providerId ?? null,
      habitualVehicleId: habitual?.vehicleId ?? null,
      habitualZoneId: habitual?.zoneId ?? null,
      habitualSectorId: habitual?.sectorId ?? null,
      executionStatus: PassengerExecutionStatus.Programmed,
      requiresTransport: true,
    };
    db.operationPassengers.push(opPassenger);
    passengerByExternal.set(person.externalId, opPassenger);
  }

  for (const planned of plan.trips) {
    const trip: Trip = {
      id: newId(),
      operationId: operation.id,
      vehicleId: planned.vehicleId,
      providerId: planned.providerId,
      sequenceNumber: planned.sequenceNumber,
      plannedCapacity: planned.plannedCapacity,
      departureTime: shift.startTime,
    };
    db.trips.push(trip);
    planned.passengerExternalIds.forEach((externalId, index) => {
      const passenger = passengerByExternal.get(externalId);
      if (!passenger) return;
      passenger.executionStatus = PassengerExecutionStatus.Assigned;
      db.tripAssignments.push({
        id: newId(),
        tripId: trip.id,
        operationPassengerId: passenger.id,
        seatOrder: index + 1,
        assignedAt: new Date().toISOString(),
      });
    });
  }

  audit("operation.plan", "operation", operation.id, {
    date: input.date,
    shiftCode: input.shiftCode,
    trips: plan.trips.length,
    unassigned: plan.unassignedExternalIds.length,
  });
  saveDb();
  return { operation, plan };
}

export function confirmOperation(operationId: string) {
  assertCanWrite();
  const db = getDb();
  const operation = db.operations.find((o) => o.id === operationId);
  if (!operation) throw new Error("Operación no encontrada");
  operation.status = OperationStatus.Confirmed;
  operation.confirmedAt = new Date().toISOString();
  audit("operation.confirm", "operation", operationId);
  saveDb();
  return operation;
}

export function createException(input: {
  operationId: string;
  operationPassengerId: string;
  newVehicleId: string;
  reason: string;
}) {
  assertCanWrite();
  const auth = authorizeException({ reason: input.reason });
  if (!auth.ok) throw new Error(auth.error);

  const db = getDb();
  const passenger = db.operationPassengers.find(
    (p) => p.id === input.operationPassengerId && p.operationId === input.operationId,
  );
  if (!passenger) throw new Error("Pasajero de operación no encontrado");

  const newVehicle = db.vehicles.find((v) => v.id === input.newVehicleId);
  if (!newVehicle) throw new Error("Vehículo destino no encontrado");

  const currentAssignment = db.tripAssignments.find(
    (ta) => ta.operationPassengerId === passenger.id,
  );
  const previousTrip = currentAssignment
    ? db.trips.find((t) => t.id === currentAssignment.tripId)
    : null;

  if (currentAssignment) {
    db.tripAssignments = db.tripAssignments.filter(
      (ta) => ta.id !== currentAssignment.id,
    );
  }

  let trip = db.trips.find(
    (t) =>
      t.operationId === input.operationId &&
      t.vehicleId === newVehicle.id &&
      t.sequenceNumber === 1,
  );
  if (!trip) {
    trip = {
      id: newId(),
      operationId: input.operationId,
      vehicleId: newVehicle.id,
      providerId: newVehicle.providerId,
      sequenceNumber: 1,
      plannedCapacity: newVehicle.authorizedCapacity,
      departureTime: null,
    };
    db.trips.push(trip);
  }

  const assignedCount = db.tripAssignments.filter(
    (ta) => ta.tripId === trip!.id,
  ).length;
  if (assignedCount >= trip.plannedCapacity) {
    throw new Error("Capacidad del vehículo destino excedida");
  }

  db.tripAssignments.push({
    id: newId(),
    tripId: trip.id,
    operationPassengerId: passenger.id,
    seatOrder: assignedCount + 1,
    assignedAt: new Date().toISOString(),
  });
  passenger.executionStatus = PassengerExecutionStatus.Reassigned;

  const exception = {
    id: newId(),
    operationId: input.operationId,
    operationPassengerId: passenger.id,
    previousProviderId: previousTrip?.providerId ?? passenger.habitualProviderId,
    previousVehicleId: previousTrip?.vehicleId ?? passenger.habitualVehicleId,
    newProviderId: newVehicle.providerId,
    newVehicleId: newVehicle.id,
    reason: input.reason.trim(),
    authorizedBy: db.session.userId,
    authorizedAt: new Date().toISOString(),
  };
  db.exceptions.unshift(exception);
  audit("exception.create", "assignment_exception", exception.id, {
    reason: exception.reason,
  });
  saveDb();
  return exception;
}

export function updatePassengerExecution(input: {
  operationPassengerId: string;
  status: (typeof PassengerExecutionStatus)[keyof typeof PassengerExecutionStatus];
}) {
  assertCanWrite();
  const db = getDb();
  const passenger = db.operationPassengers.find(
    (p) => p.id === input.operationPassengerId,
  );
  if (!passenger) throw new Error("Pasajero no encontrado");
  passenger.executionStatus = input.status;
  audit("execution.update", "operation_passenger", passenger.id, {
    status: input.status,
  });
  saveDb();
  return passenger;
}

export function registerIncident(input: {
  operationId: string;
  category: string;
  description: string;
  tripId?: string | null;
  operationPassengerId?: string | null;
}) {
  assertCanWrite();
  const db = getDb();
  if (!db.operations.some((o) => o.id === input.operationId)) {
    throw new Error("Operación no encontrada");
  }
  const incident = {
    id: newId(),
    operationId: input.operationId,
    tripId: input.tripId ?? null,
    operationPassengerId: input.operationPassengerId ?? null,
    category: input.category.trim(),
    description: input.description.trim(),
    reportedBy: db.session.userId,
    createdAt: new Date().toISOString(),
  };
  db.incidents.unshift(incident);
  audit("incident.create", "incident", incident.id, {
    category: incident.category,
  });
  saveDb();
  return incident;
}

export function getOperationDetail(operationId: string) {
  const db = getDb();
  const operation = db.operations.find((o) => o.id === operationId);
  if (!operation) return null;
  const shift = db.shifts.find((s) => s.id === operation.shiftId) ?? null;
  const passengers = db.operationPassengers.filter(
    (p) => p.operationId === operationId,
  );
  const trips = db.trips.filter((t) => t.operationId === operationId);
  const assignments = db.tripAssignments.filter((ta) =>
    trips.some((t) => t.id === ta.tripId),
  );
  return {
    operation,
    shift,
    passengers,
    trips,
    assignments,
    exceptions: db.exceptions.filter((e) => e.operationId === operationId),
    incidents: db.incidents.filter((i) => i.operationId === operationId),
    vehicles: db.vehicles,
    providers: db.providers,
  };
}

export function buildNomina(input: {
  operationId: string;
  providerId?: string;
  vehicleId?: string;
}) {
  const detail = getOperationDetail(input.operationId);
  if (!detail) throw new Error("Operación no encontrada");

  const rows = detail.trips
    .filter((trip) => {
      if (input.providerId && trip.providerId !== input.providerId) return false;
      if (input.vehicleId && trip.vehicleId !== input.vehicleId) return false;
      return true;
    })
    .flatMap((trip) => {
      const vehicle = detail.vehicles.find((v) => v.id === trip.vehicleId);
      const provider = detail.providers.find((p) => p.id === trip.providerId);
      const tripPassengers = detail.assignments
        .filter((a) => a.tripId === trip.id)
        .map((a) =>
          detail.passengers.find((p) => p.id === a.operationPassengerId),
        )
        .filter(Boolean);

      return tripPassengers.map((passenger, index) => ({
        fecha: detail.operation.operationDate,
        turno: detail.shift?.code ?? "",
        proveedor: provider?.name ?? "",
        patente: vehicle?.plate ?? "",
        secuencia: trip.sequenceNumber,
        orden: index + 1,
        idExterno: passenger!.externalIdSnapshot,
        nombre: passenger!.fullNameSnapshot,
        estado: passenger!.executionStatus,
      }));
    });

  return {
    operation: detail.operation,
    shift: detail.shift,
    rows,
  };
}

export function setSessionRole(role: "admin" | "planner" | "operator" | "viewer") {
  const db = getDb();
  db.session.role = role;
  const profile = db.profiles[0];
  if (profile) profile.role = role;
  audit("session.role", "profile", profile?.id ?? null, { role });
  saveDb();
  return db.session;
}
