import type { HabitualAssignment, Person, Vehicle } from "@/domain/types";
import { VehicleStatus } from "@/domain/types";
import {
  canAssignPassenger,
  summarizeCapacity,
  type CapacitySummary,
  type CapacityVehicleInput,
} from "./capacity";
import { groupForPlanning, type PassengerGroup } from "./grouping";
import {
  filterEligibleForPlanning,
  identifyPersons,
  type IdentifiedPersonResult,
  type ImportPersonRow,
} from "./identification";

export interface PlanOperationInput {
  date: string;
  shiftCode: string;
  rows: ImportPersonRow[];
  existingPersons: Person[];
  /** Lectura sola: planOperation no muta este mapa ni las asignaciones */
  habitualByPersonId: Map<string, HabitualAssignment>;
  vehicles: Vehicle[];
}

export interface PlannedTrip {
  vehicleId: string;
  providerId: string;
  sequenceNumber: number;
  plannedCapacity: number;
  passengerExternalIds: string[];
}

export interface PlanOperationResult {
  identified: IdentifiedPersonResult[];
  eligible: IdentifiedPersonResult[];
  groups: PassengerGroup[];
  trips: PlannedTrip[];
  unassignedExternalIds: string[];
  capacity: CapacitySummary;
  warnings: string[];
}

export interface AuthorizeExceptionInput {
  reason: string;
}

export interface AuthorizeExceptionResult {
  ok: boolean;
  error?: string;
}

function isVehicleAssignable(vehicle: Vehicle | undefined): vehicle is Vehicle {
  return Boolean(
    vehicle &&
      vehicle.isActive &&
      vehicle.status === VehicleStatus.Available &&
      vehicle.authorizedCapacity > 0,
  );
}

/**
 * Planifica una operación a partir de nómina + maestros.
 * Respeta capacidad autorizada del vehículo habitual; no modifica asignaciones habituales.
 * Si no hay vehículo habitual disponible o no hay cupo, el pasajero queda en `unassigned`.
 */
export function planOperation(input: PlanOperationInput): PlanOperationResult {
  const warnings: string[] = [];

  const identified = identifyPersons({
    rows: input.rows,
    existingPersons: input.existingPersons,
    habitualByPersonId: input.habitualByPersonId,
  });

  const eligible = filterEligibleForPlanning(identified);

  const groups = groupForPlanning({
    date: input.date,
    shiftCode: input.shiftCode,
    persons: eligible,
  });

  const vehiclesById = new Map(
    input.vehicles.map((vehicle) => [vehicle.id, vehicle]),
  );

  const trips: PlannedTrip[] = [];
  const unassignedExternalIds: string[] = [];
  const assignedByVehicle = new Map<string, number>();

  for (const group of groups) {
    const vehicleId = group.key.habitualVehicleId;

    if (!vehicleId) {
      for (const member of group.members) {
        unassignedExternalIds.push(member.externalId);
      }
      warnings.push(
        `Grupo ${group.keyId}: sin vehículo habitual; ${group.members.length} pasajero(s) sin asignar`,
      );
      continue;
    }

    const vehicle = vehiclesById.get(vehicleId);

    if (!isVehicleAssignable(vehicle)) {
      for (const member of group.members) {
        unassignedExternalIds.push(member.externalId);
      }
      if (!vehicle) {
        warnings.push(
          `Vehículo habitual ${vehicleId} no encontrado; ${group.members.length} pasajero(s) sin asignar`,
        );
      } else {
        warnings.push(
          `Vehículo habitual ${vehicleId} no disponible; ${group.members.length} pasajero(s) sin asignar`,
        );
      }
      continue;
    }

    const passengerExternalIds: string[] = [];
    let currentlyAssigned = assignedByVehicle.get(vehicle.id) ?? 0;

    for (const member of group.members) {
      if (
        canAssignPassenger({
          authorizedCapacity: vehicle.authorizedCapacity,
          currentlyAssigned,
        })
      ) {
        passengerExternalIds.push(member.externalId);
        currentlyAssigned += 1;
      } else {
        unassignedExternalIds.push(member.externalId);
      }
    }

    assignedByVehicle.set(vehicle.id, currentlyAssigned);

    if (passengerExternalIds.length < group.members.length) {
      warnings.push(
        `Vehículo ${vehicle.id}: cupo ${vehicle.authorizedCapacity} excedido; ${group.members.length - passengerExternalIds.length} pasajero(s) pendientes`,
      );
    }

    if (passengerExternalIds.length > 0) {
      const existingSequences = trips.filter(
        (trip) => trip.vehicleId === vehicle.id,
      ).length;
      trips.push({
        vehicleId: vehicle.id,
        providerId: vehicle.providerId,
        sequenceNumber: existingSequences + 1,
        plannedCapacity: vehicle.authorizedCapacity,
        passengerExternalIds,
      });
    }
  }

  const capacityVehicles: CapacityVehicleInput[] = input.vehicles.map(
    (vehicle) => ({
      vehicle,
      assignedPassengers: assignedByVehicle.get(vehicle.id) ?? 0,
    }),
  );

  const capacity = summarizeCapacity({
    passengersScheduled: eligible.length,
    vehicles: capacityVehicles,
  });

  return {
    identified,
    eligible,
    groups,
    trips,
    unassignedExternalIds,
    capacity,
    warnings,
  };
}

/**
 * Autoriza una excepción de planificación. Requiere motivo no vacío.
 */
export function authorizeException(
  input: AuthorizeExceptionInput,
): AuthorizeExceptionResult {
  const reason = input.reason.trim();
  if (!reason) {
    return {
      ok: false,
      error: "El motivo de la excepción es obligatorio",
    };
  }
  return { ok: true };
}
