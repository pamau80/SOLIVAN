import { authorizeException, planOperation } from "@/domain/rules";
import {
  OperationStatus,
  PassengerExecutionStatus,
  TransportCondition,
} from "@/domain/types";
import type {
  AssignmentException,
  HabitualAssignment,
  ImportBatch,
  Incident,
  Operation,
  OperationPassenger,
  Person,
  Provider,
  Shift,
  TripAssignment,
  Vehicle,
} from "@/domain/types";
import { createClient } from "@/lib/supabase/server";
import {
  mapAssignment,
  mapException,
  mapImportBatch,
  mapImportBatchRow,
  mapIncident,
  mapOperation,
  mapPassenger,
  mapShift,
  mapTrip,
} from "./ops-mappers";
import {
  mapHabitual,
  mapPerson,
  mapProvider,
  mapVehicle,
  personToRow,
} from "./mappers";
import { supabaseAudit } from "./supabase-audit";

async function client() {
  return createClient();
}

function newId() {
  return crypto.randomUUID();
}

async function actorId() {
  const supabase = await client();
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function supabaseListShifts(): Promise<Shift[]> {
  const supabase = await client();
  const { data, error } = await supabase
    .from("shifts")
    .select("*")
    .eq("is_active", true)
    .order("code");
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapShift(row as Record<string, unknown>));
}

export async function supabaseListOperations(): Promise<{
  operations: Operation[];
  shifts: Shift[];
  vehicles: Vehicle[];
  providers: Provider[];
}> {
  const supabase = await client();
  const [ops, shifts, vehicles, providers] = await Promise.all([
    supabase.from("operations").select("*").order("operation_date", { ascending: false }),
    supabase.from("shifts").select("*").eq("is_active", true),
    supabase.from("vehicles").select("*").eq("is_active", true),
    supabase.from("providers").select("*").eq("is_active", true),
  ]);
  if (ops.error) throw new Error(ops.error.message);
  if (shifts.error) throw new Error(shifts.error.message);
  if (vehicles.error) throw new Error(vehicles.error.message);
  if (providers.error) throw new Error(providers.error.message);
  return {
    operations: (ops.data ?? []).map((row) =>
      mapOperation(row as Record<string, unknown>),
    ),
    shifts: (shifts.data ?? []).map((row) =>
      mapShift(row as Record<string, unknown>),
    ),
    vehicles: (vehicles.data ?? []).map((row) =>
      mapVehicle(row as Record<string, unknown>),
    ),
    providers: (providers.data ?? []).map((row) =>
      mapProvider(row as Record<string, unknown>),
    ),
  };
}

export async function supabaseGetOperationDetail(operationId: string) {
  const supabase = await client();
  const { data: operationRow, error } = await supabase
    .from("operations")
    .select("*")
    .eq("id", operationId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!operationRow) return null;

  const [
    shiftRes,
    passengersRes,
    tripsRes,
    exceptionsRes,
    incidentsRes,
    vehiclesRes,
    providersRes,
  ] = await Promise.all([
    supabase.from("shifts").select("*").eq("id", operationRow.shift_id).maybeSingle(),
    supabase.from("operation_passengers").select("*").eq("operation_id", operationId),
    supabase.from("trips").select("*").eq("operation_id", operationId),
    supabase.from("assignment_exceptions").select("*").eq("operation_id", operationId),
    supabase.from("incidents").select("*").eq("operation_id", operationId),
    supabase.from("vehicles").select("*").eq("is_active", true),
    supabase.from("providers").select("*").eq("is_active", true),
  ]);

  if (passengersRes.error) throw new Error(passengersRes.error.message);
  if (tripsRes.error) throw new Error(tripsRes.error.message);
  if (exceptionsRes.error) throw new Error(exceptionsRes.error.message);
  if (incidentsRes.error) throw new Error(incidentsRes.error.message);
  if (vehiclesRes.error) throw new Error(vehiclesRes.error.message);
  if (providersRes.error) throw new Error(providersRes.error.message);

  const trips = (tripsRes.data ?? []).map((row) =>
    mapTrip(row as Record<string, unknown>),
  );
  const tripIds = trips.map((t) => t.id);
  let assignments: TripAssignment[] = [];
  if (tripIds.length) {
    const { data, error: assignError } = await supabase
      .from("trip_assignments")
      .select("*")
      .in("trip_id", tripIds);
    if (assignError) throw new Error(assignError.message);
    assignments = (data ?? []).map((row) =>
      mapAssignment(row as Record<string, unknown>),
    );
  }

  return {
    operation: mapOperation(operationRow as Record<string, unknown>),
    shift: shiftRes.data
      ? mapShift(shiftRes.data as Record<string, unknown>)
      : null,
    passengers: (passengersRes.data ?? []).map((row) =>
      mapPassenger(row as Record<string, unknown>),
    ),
    trips,
    assignments,
    exceptions: (exceptionsRes.data ?? []).map((row) =>
      mapException(row as Record<string, unknown>),
    ),
    incidents: (incidentsRes.data ?? []).map((row) =>
      mapIncident(row as Record<string, unknown>),
    ),
    vehicles: (vehiclesRes.data ?? []).map((row) =>
      mapVehicle(row as Record<string, unknown>),
    ),
    providers: (providersRes.data ?? []).map((row) =>
      mapProvider(row as Record<string, unknown>),
    ),
  };
}

async function loadPlanningContext(): Promise<{
  persons: Person[];
  vehicles: Vehicle[];
  habitualByPersonId: Map<string, HabitualAssignment>;
  shifts: Shift[];
}> {
  const supabase = await client();
  const [personsRes, vehiclesRes, habitualRes, shiftsRes] = await Promise.all([
    supabase.from("persons").select("*").eq("is_active", true),
    supabase.from("vehicles").select("*").eq("is_active", true),
    supabase.from("habitual_assignments").select("*").eq("is_current", true),
    supabase.from("shifts").select("*").eq("is_active", true),
  ]);
  if (personsRes.error) throw new Error(personsRes.error.message);
  if (vehiclesRes.error) throw new Error(vehiclesRes.error.message);
  if (habitualRes.error) throw new Error(habitualRes.error.message);
  if (shiftsRes.error) throw new Error(shiftsRes.error.message);

  const persons = (personsRes.data ?? []).map((row) =>
    mapPerson(row as Record<string, unknown>),
  );
  const vehicles = (vehiclesRes.data ?? []).map((row) =>
    mapVehicle(row as Record<string, unknown>),
  );
  const habitual = (habitualRes.data ?? []).map((row) =>
    mapHabitual(row as Record<string, unknown>),
  );
  const shifts = (shiftsRes.data ?? []).map((row) =>
    mapShift(row as Record<string, unknown>),
  );

  return {
    persons,
    vehicles,
    habitualByPersonId: new Map(habitual.map((h) => [h.personId, h] as const)),
    shifts,
  };
}

export async function supabasePreviewImport(input: {
  filename: string;
  mapping: Record<string, string>;
  rows: Record<string, unknown>[];
}) {
  const ctx = await loadPlanningContext();
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
    existingPersons: ctx.persons,
    habitualByPersonId: ctx.habitualByPersonId,
    vehicles: ctx.vehicles,
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

export async function supabaseCommitImport(input: {
  filename: string;
  mapping: Record<string, string>;
  rows: Record<string, unknown>[];
  createMissingPersons?: boolean;
}): Promise<ImportBatch> {
  const supabase = await client();
  const preview = await supabasePreviewImport(input);
  const batchId = newId();
  const actor = await actorId();

  let status: ImportBatch["status"] = "imported";
  if (preview.errorCount > 0 && preview.errorCount < preview.rowCount) {
    status = "partial";
  } else if (preview.errorCount === preview.rowCount && preview.rowCount > 0) {
    status = "rejected";
  }

  const { error: batchError } = await supabase.from("import_batches").insert({
    id: batchId,
    source_filename: input.filename,
    imported_by: actor,
    status,
    row_count: preview.rowCount,
    error_count: preview.errorCount,
    mapping: input.mapping,
    summary: {
      newCount: preview.newCount,
      duplicateCount: preview.duplicateCount,
    },
    completed_at: new Date().toISOString(),
  });
  if (batchError) throw new Error(batchError.message);

  const rowPayloads = [];
  for (const item of preview.preview) {
    let personId: string | null = item.matchedPerson?.id ?? null;
    if (
      !personId &&
      item.isNewPerson &&
      input.createMissingPersons !== false &&
      item.externalId &&
      item.fullName
    ) {
      const person: Person = {
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
      const { error: personError } = await supabase
        .from("persons")
        .upsert({ id: person.id, ...personToRow(person) });
      if (personError) throw new Error(personError.message);
      personId = person.id;
    }

    rowPayloads.push({
      id: newId(),
      batch_id: batchId,
      row_number: item.rowNumber,
      raw_payload: (item.raw as Record<string, unknown>) ?? {},
      external_id: item.externalId || null,
      validation_errors: item.issues.map((i) => i.message),
      person_id: personId,
      is_duplicate: item.isDuplicateInBatch,
      is_new_person: item.isNewPerson,
    });
  }

  if (rowPayloads.length) {
    const { error: rowsError } = await supabase
      .from("import_batch_rows")
      .insert(rowPayloads);
    if (rowsError) throw new Error(rowsError.message);
  }

  await supabaseAudit("import.commit", "import_batch", batchId, {
    filename: input.filename,
    rowCount: preview.rowCount,
  });

  return {
    id: batchId,
    sourceFilename: input.filename,
    status,
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
}

export async function supabaseListImports() {
  const supabase = await client();
  const [batches, rows] = await Promise.all([
    supabase
      .from("import_batches")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("import_batch_rows")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200),
  ]);
  if (batches.error) throw new Error(batches.error.message);
  if (rows.error) throw new Error(rows.error.message);
  return {
    batches: (batches.data ?? []).map((row) =>
      mapImportBatch(row as Record<string, unknown>),
    ),
    rows: (rows.data ?? []).map((row) =>
      mapImportBatchRow(row as Record<string, unknown>),
    ),
  };
}

export async function supabaseCreatePlannedOperation(input: {
  date: string;
  shiftCode: string;
  personExternalIds?: string[];
}) {
  const supabase = await client();
  const ctx = await loadPlanningContext();
  const shift = ctx.shifts.find((s) => s.code === input.shiftCode);
  if (!shift) throw new Error("Turno no encontrado");

  const sourcePersons = ctx.persons.filter((p) => {
    if (!p.isActive) return false;
    if (input.personExternalIds?.length) {
      return input.personExternalIds.includes(p.externalId);
    }
    return p.transportCondition === TransportCondition.UsesTransport;
  });

  const plan = planOperation({
    date: input.date,
    shiftCode: input.shiftCode,
    rows: sourcePersons.map((p, index) => ({
      rowNumber: index + 1,
      externalId: p.externalId,
      nationalId: p.nationalId,
      fullName: p.fullName,
      transportCondition: p.transportCondition,
    })),
    existingPersons: ctx.persons,
    habitualByPersonId: ctx.habitualByPersonId,
    vehicles: ctx.vehicles,
  });

  const { data: existing } = await supabase
    .from("operations")
    .select("id")
    .eq("operation_date", input.date)
    .eq("shift_id", shift.id)
    .maybeSingle();
  if (existing?.id) {
    const { error: deleteError } = await supabase
      .from("operations")
      .delete()
      .eq("id", existing.id);
    if (deleteError) throw new Error(deleteError.message);
  }

  const operationId = newId();
  const actor = await actorId();
  const { error: opError } = await supabase.from("operations").insert({
    id: operationId,
    operation_date: input.date,
    shift_id: shift.id,
    status: OperationStatus.Planned,
    planned_by: actor,
  });
  if (opError) throw new Error(opError.message);

  const passengerByExternal = new Map<string, OperationPassenger>();
  const passengerRows = [];
  for (const item of plan.eligible) {
    const person = item.matchedPerson;
    if (!person) continue;
    const habitual = item.habitualAssignment;
    const passenger: OperationPassenger = {
      id: newId(),
      operationId,
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
    passengerByExternal.set(person.externalId, passenger);
    passengerRows.push({
      id: passenger.id,
      operation_id: operationId,
      person_id: passenger.personId,
      external_id_snapshot: passenger.externalIdSnapshot,
      full_name_snapshot: passenger.fullNameSnapshot,
      transport_condition_snapshot: passenger.transportConditionSnapshot,
      habitual_provider_id: passenger.habitualProviderId,
      habitual_vehicle_id: passenger.habitualVehicleId,
      habitual_zone_id: passenger.habitualZoneId,
      habitual_sector_id: passenger.habitualSectorId,
      execution_status: passenger.executionStatus,
      requires_transport: true,
    });
  }
  if (passengerRows.length) {
    const { error } = await supabase
      .from("operation_passengers")
      .insert(passengerRows);
    if (error) throw new Error(error.message);
  }

  const tripRows: Array<Record<string, unknown>> = [];
  const assignmentRows: Array<Record<string, unknown>> = [];
  const passengerUpdates: { id: string; status: string }[] = [];

  for (const planned of plan.trips) {
    const tripId = newId();
    tripRows.push({
      id: tripId,
      operation_id: operationId,
      vehicle_id: planned.vehicleId,
      provider_id: planned.providerId,
      sequence_number: planned.sequenceNumber,
      planned_capacity: planned.plannedCapacity,
      departure_time: shift.startTime,
    });
    planned.passengerExternalIds.forEach((externalId, index) => {
      const passenger = passengerByExternal.get(externalId);
      if (!passenger) return;
      passengerUpdates.push({
        id: passenger.id,
        status: PassengerExecutionStatus.Assigned,
      });
      assignmentRows.push({
        id: newId(),
        trip_id: tripId,
        operation_passenger_id: passenger.id,
        seat_order: index + 1,
      });
    });
  }

  if (tripRows.length) {
    const { error } = await supabase.from("trips").insert(tripRows);
    if (error) throw new Error(error.message);
  }
  if (assignmentRows.length) {
    const { error } = await supabase
      .from("trip_assignments")
      .insert(assignmentRows);
    if (error) throw new Error(error.message);
  }
  for (const update of passengerUpdates) {
    const { error } = await supabase
      .from("operation_passengers")
      .update({ execution_status: update.status })
      .eq("id", update.id);
    if (error) throw new Error(error.message);
  }

  const operation: Operation = {
    id: operationId,
    operationDate: input.date,
    shiftId: shift.id,
    status: OperationStatus.Planned,
    importBatchId: null,
    notes: null,
    confirmedAt: null,
  };

  await supabaseAudit("operation.plan", "operation", operationId, {
    date: input.date,
    shiftCode: input.shiftCode,
    trips: plan.trips.length,
    unassigned: plan.unassignedExternalIds.length,
  });

  return { operation, plan };
}

export async function supabaseConfirmOperation(operationId: string) {
  const supabase = await client();
  const { data, error } = await supabase
    .from("operations")
    .update({
      status: OperationStatus.Confirmed,
      confirmed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", operationId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  await supabaseAudit("operation.confirm", "operation", operationId);
  return mapOperation(data as Record<string, unknown>);
}

export async function supabaseUpdatePassengerExecution(input: {
  operationPassengerId: string;
  status: (typeof PassengerExecutionStatus)[keyof typeof PassengerExecutionStatus];
}) {
  const supabase = await client();
  const { data, error } = await supabase
    .from("operation_passengers")
    .update({
      execution_status: input.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.operationPassengerId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  await supabaseAudit("execution.update", "operation_passenger", input.operationPassengerId, {
    status: input.status,
  });
  return mapPassenger(data as Record<string, unknown>);
}

export async function supabaseRegisterIncident(input: {
  operationId: string;
  category: string;
  description: string;
  tripId?: string | null;
  operationPassengerId?: string | null;
}): Promise<Incident> {
  const supabase = await client();
  const actor = await actorId();
  const incident = {
    id: newId(),
    operation_id: input.operationId,
    trip_id: input.tripId ?? null,
    operation_passenger_id: input.operationPassengerId ?? null,
    category: input.category.trim(),
    description: input.description.trim(),
    reported_by: actor,
  };
  const { data, error } = await supabase
    .from("incidents")
    .insert(incident)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  await supabaseAudit("incident.create", "incident", String(data.id), {
    category: input.category,
  });
  return mapIncident(data as Record<string, unknown>);
}

export async function supabaseCreateException(input: {
  operationId: string;
  operationPassengerId: string;
  newVehicleId: string;
  reason: string;
}): Promise<AssignmentException> {
  const auth = authorizeException({ reason: input.reason });
  if (!auth.ok) throw new Error(auth.error);

  const supabase = await client();
  const detail = await supabaseGetOperationDetail(input.operationId);
  if (!detail) throw new Error("Operación no encontrada");

  const passenger = detail.passengers.find(
    (p) => p.id === input.operationPassengerId,
  );
  if (!passenger) throw new Error("Pasajero de operación no encontrado");

  const newVehicle = detail.vehicles.find((v) => v.id === input.newVehicleId);
  if (!newVehicle) throw new Error("Vehículo destino no encontrado");

  const currentAssignment = detail.assignments.find(
    (ta) => ta.operationPassengerId === passenger.id,
  );
  const previousTrip = currentAssignment
    ? detail.trips.find((t) => t.id === currentAssignment.tripId)
    : null;

  if (currentAssignment) {
    const { error } = await supabase
      .from("trip_assignments")
      .delete()
      .eq("id", currentAssignment.id);
    if (error) throw new Error(error.message);
  }

  let trip = detail.trips.find(
    (t) =>
      t.vehicleId === newVehicle.id && t.sequenceNumber === 1,
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
    const { error } = await supabase.from("trips").insert({
      id: trip.id,
      operation_id: trip.operationId,
      vehicle_id: trip.vehicleId,
      provider_id: trip.providerId,
      sequence_number: trip.sequenceNumber,
      planned_capacity: trip.plannedCapacity,
    });
    if (error) throw new Error(error.message);
  }

  const assignedCount = detail.assignments.filter(
    (ta) => ta.tripId === trip!.id && ta.id !== currentAssignment?.id,
  ).length;
  if (assignedCount >= trip.plannedCapacity) {
    throw new Error("Capacidad del vehículo destino excedida");
  }

  const { error: assignError } = await supabase.from("trip_assignments").insert({
    id: newId(),
    trip_id: trip.id,
    operation_passenger_id: passenger.id,
    seat_order: assignedCount + 1,
  });
  if (assignError) throw new Error(assignError.message);

  await supabase
    .from("operation_passengers")
    .update({ execution_status: PassengerExecutionStatus.Reassigned })
    .eq("id", passenger.id);

  const actor = await actorId();
  const { data, error } = await supabase
    .from("assignment_exceptions")
    .insert({
      id: newId(),
      operation_id: input.operationId,
      operation_passenger_id: passenger.id,
      previous_provider_id:
        previousTrip?.providerId ?? passenger.habitualProviderId,
      previous_vehicle_id:
        previousTrip?.vehicleId ?? passenger.habitualVehicleId,
      new_provider_id: newVehicle.providerId,
      new_vehicle_id: newVehicle.id,
      reason: input.reason.trim(),
      authorized_by: actor,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  await supabaseAudit("exception.create", "assignment_exception", String(data.id), {
    reason: input.reason,
  });
  return mapException(data as Record<string, unknown>);
}

export async function supabaseDashboardStats() {
  const supabase = await client();
  const [persons, vehicles, operations, exceptions, incidents, imports, audit] =
    await Promise.all([
      supabase
        .from("persons")
        .select("id, transport_condition", { count: "exact" })
        .eq("is_active", true),
      supabase
        .from("vehicles")
        .select("id, authorized_capacity, status", { count: "exact" })
        .eq("is_active", true),
      supabase.from("operations").select("id, status", { count: "exact" }),
      supabase.from("assignment_exceptions").select("id", { count: "exact" }),
      supabase.from("incidents").select("id", { count: "exact" }),
      supabase.from("import_batches").select("id", { count: "exact" }),
      supabase
        .from("audit_log")
        .select("id, action, entity_type, created_at")
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

  if (persons.error) throw new Error(persons.error.message);
  if (vehicles.error) throw new Error(vehicles.error.message);
  if (operations.error) throw new Error(operations.error.message);

  const personRows = persons.data ?? [];
  const vehicleRows = vehicles.data ?? [];
  const available = vehicleRows.filter((v) => v.status === "available");

  return {
    persons: personRows.length,
    usesTransport: personRows.filter(
      (p) => p.transport_condition === TransportCondition.UsesTransport,
    ).length,
    vehiclesAvailable: available.length,
    totalCapacity: available.reduce(
      (sum, v) => sum + Number(v.authorized_capacity ?? 0),
      0,
    ),
    operations: operations.count ?? operations.data?.length ?? 0,
    openOperations: (operations.data ?? []).filter(
      (o) => o.status !== "completed" && o.status !== "cancelled",
    ).length,
    importBatches: imports.count ?? imports.data?.length ?? 0,
    exceptions: exceptions.count ?? exceptions.data?.length ?? 0,
    incidents: incidents.count ?? incidents.data?.length ?? 0,
    auditRecent: (audit.data ?? []).map((row) => ({
      id: String(row.id),
      action: String(row.action),
      entityType: String(row.entity_type),
      createdAt: String(row.created_at),
    })),
  };
}

export async function supabaseBuildOperationalReport(filters?: {
  from?: string;
  to?: string;
  shiftCode?: string;
}) {
  const list = await supabaseListOperations();
  const shiftsById = new Map(list.shifts.map((s) => [s.id, s]));
  const rows = [];

  for (const op of list.operations) {
    if (filters?.from && op.operationDate < filters.from) continue;
    if (filters?.to && op.operationDate > filters.to) continue;
    const shift = shiftsById.get(op.shiftId);
    if (filters?.shiftCode && shift?.code !== filters.shiftCode) continue;

    const detail = await supabaseGetOperationDetail(op.id);
    if (!detail) continue;
    const assigned = detail.assignments.length;
    rows.push({
      operationId: op.id,
      date: op.operationDate,
      shiftCode: shift?.code ?? "?",
      status: op.status,
      passengers: detail.passengers.length,
      assigned: detail.passengers.filter((p) =>
        ["assigned", "transported", "reassigned"].includes(p.executionStatus),
      ).length,
      transported: detail.passengers.filter(
        (p) => p.executionStatus === "transported",
      ).length,
      absent: detail.passengers.filter((p) => p.executionStatus === "absent")
        .length,
      unassigned: Math.max(0, detail.passengers.length - assigned),
      trips: detail.trips.length,
      exceptions: detail.exceptions.length,
      incidents: detail.incidents.length,
      occupancyPercent:
        detail.trips.length === 0
          ? 0
          : Math.round(
              (assigned /
                detail.trips.reduce((s, t) => s + t.plannedCapacity, 0)) *
                1000,
            ) / 10,
    });
  }

  rows.sort((a, b) => b.date.localeCompare(a.date));
  const totals = {
    operations: rows.length,
    passengers: rows.reduce((sum, r) => sum + r.passengers, 0),
    transported: rows.reduce((sum, r) => sum + r.transported, 0),
    absent: rows.reduce((sum, r) => sum + r.absent, 0),
    exceptions: rows.reduce((sum, r) => sum + r.exceptions, 0),
    incidents: rows.reduce((sum, r) => sum + r.incidents, 0),
    avgOccupancyPercent:
      rows.length === 0
        ? 0
        : Math.round(
            (rows.reduce((sum, r) => sum + r.occupancyPercent, 0) / rows.length) *
              10,
          ) / 10,
  };
  return { rows, totals };
}
