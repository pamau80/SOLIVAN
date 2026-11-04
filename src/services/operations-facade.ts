import { getAppEnv } from "@/lib/env";
import { getDb } from "@/services/local/db";
import { getDashboardStats } from "@/services/catalog-service";
import {
  buildNomina,
  commitImport,
  confirmOperation,
  createException,
  createPlannedOperation,
  getOperationDetail,
  previewImport,
  registerIncident,
  updatePassengerExecution,
} from "@/services/operations-service";
import { buildOperationalReport } from "@/services/reports-service";
import * as sb from "@/services/repository/supabase-operations";

function isSupabase() {
  return getAppEnv().runtimeMode === "supabase";
}

export async function listOperationsFacade() {
  if (isSupabase()) return sb.supabaseListOperations();
  const db = getDb();
  return {
    operations: db.operations,
    shifts: db.shifts,
    vehicles: db.vehicles,
    providers: db.providers,
  };
}

export async function getOperationDetailFacade(operationId: string) {
  if (isSupabase()) return sb.supabaseGetOperationDetail(operationId);
  return getOperationDetail(operationId);
}

export async function previewImportFacade(input: {
  filename: string;
  mapping: Record<string, string>;
  rows: Record<string, unknown>[];
}) {
  if (isSupabase()) return sb.supabasePreviewImport(input);
  return previewImport(input);
}

export async function commitImportFacade(input: {
  filename: string;
  mapping: Record<string, string>;
  rows: Record<string, unknown>[];
  createMissingPersons?: boolean;
}) {
  if (isSupabase()) return sb.supabaseCommitImport(input);
  return commitImport(input);
}

export async function listImportsFacade() {
  if (isSupabase()) return sb.supabaseListImports();
  const db = getDb();
  return {
    batches: db.importBatches,
    rows: db.importBatchRows.slice(0, 200),
  };
}

export async function planOperationFacade(input: {
  date: string;
  shiftCode: string;
  personExternalIds?: string[];
}) {
  if (isSupabase()) return sb.supabaseCreatePlannedOperation(input);
  return createPlannedOperation(input);
}

export async function confirmOperationFacade(operationId: string) {
  if (isSupabase()) return sb.supabaseConfirmOperation(operationId);
  return confirmOperation(operationId);
}

export async function createExceptionFacade(input: {
  operationId: string;
  operationPassengerId: string;
  newVehicleId: string;
  reason: string;
}) {
  if (isSupabase()) return sb.supabaseCreateException(input);
  return createException(input);
}

export async function updatePassengerExecutionFacade(input: {
  operationPassengerId: string;
  status: Parameters<typeof updatePassengerExecution>[0]["status"];
}) {
  if (isSupabase()) return sb.supabaseUpdatePassengerExecution(input);
  return updatePassengerExecution(input);
}

export async function registerIncidentFacade(input: {
  operationId: string;
  category: string;
  description: string;
  tripId?: string | null;
  operationPassengerId?: string | null;
}) {
  if (isSupabase()) return sb.supabaseRegisterIncident(input);
  return registerIncident(input);
}

export async function buildNominaFacade(input: {
  operationId: string;
  providerId?: string;
  vehicleId?: string;
}) {
  if (isSupabase()) {
    const detail = await sb.supabaseGetOperationDetail(input.operationId);
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
  return buildNomina(input);
}

export async function getDashboardStatsFacade() {
  if (isSupabase()) return sb.supabaseDashboardStats();
  return getDashboardStats();
}

export async function listShiftsFacade() {
  if (isSupabase()) return sb.supabaseListShifts();
  return getDb().shifts;
}

export async function buildOperationalReportFacade(filters?: {
  from?: string;
  to?: string;
  shiftCode?: string;
}) {
  if (isSupabase()) return sb.supabaseBuildOperationalReport(filters);
  return buildOperationalReport(filters);
}
