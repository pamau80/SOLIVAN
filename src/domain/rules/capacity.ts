import type { Vehicle } from "../types";
import { VehicleStatus } from "../types";

export interface CapacityVehicleInput {
  vehicle: Vehicle;
  /** Pasajeros ya asignados a este vehículo en la operación/secuencia */
  assignedPassengers: number;
  /** Si el mismo vehículo hace un viaje sucesivo, cada secuencia se evalúa aparte */
  sequenceNumber?: number;
}

export interface CapacitySummary {
  passengersScheduled: number;
  totalAvailableCapacity: number;
  occupiedCapacity: number;
  occupancyPercent: number;
  vehiclesAvailable: number;
  vehiclesRequiredTheoreticalMin: number;
  capacityDeficit: number;
  unassignedPassengers: number;
  overloadedVehicleIds: string[];
}

/**
 * Calcula capacidad operativa.
 * Importante: el mínimo teórico de vehículos ≠ vehículos físicos necesarios
 * cuando un vehículo puede hacer recorridos sucesivos.
 */
export function summarizeCapacity(input: {
  passengersScheduled: number;
  vehicles: CapacityVehicleInput[];
}): CapacitySummary {
  const available = input.vehicles.filter(
    (item) =>
      item.vehicle.isActive &&
      item.vehicle.status === VehicleStatus.Available &&
      item.vehicle.authorizedCapacity > 0,
  );

  const totalAvailableCapacity = available.reduce(
    (sum, item) => sum + item.vehicle.authorizedCapacity,
    0,
  );

  const occupiedCapacity = available.reduce(
    (sum, item) => sum + Math.max(0, item.assignedPassengers),
    0,
  );

  const overloadedVehicleIds = available
    .filter(
      (item) => item.assignedPassengers > item.vehicle.authorizedCapacity,
    )
    .map((item) => item.vehicle.id);

  const remainingSeats = available.reduce((sum, item) => {
    const free = item.vehicle.authorizedCapacity - item.assignedPassengers;
    return sum + Math.max(0, free);
  }, 0);

  const unassignedPassengers = Math.max(
    0,
    input.passengersScheduled - occupiedCapacity,
  );

  const capacityDeficit = Math.max(0, unassignedPassengers - remainingSeats);

  const maxCap = available.reduce(
    (max, item) => Math.max(max, item.vehicle.authorizedCapacity),
    0,
  );

  const vehiclesRequiredTheoreticalMin =
    maxCap === 0
      ? input.passengersScheduled > 0
        ? Number.POSITIVE_INFINITY
        : 0
      : Math.ceil(input.passengersScheduled / maxCap);

  const occupancyPercent =
    totalAvailableCapacity === 0
      ? 0
      : Math.round((occupiedCapacity / totalAvailableCapacity) * 1000) / 10;

  return {
    passengersScheduled: input.passengersScheduled,
    totalAvailableCapacity,
    occupiedCapacity,
    occupancyPercent,
    vehiclesAvailable: available.length,
    vehiclesRequiredTheoreticalMin,
    capacityDeficit,
    unassignedPassengers,
    overloadedVehicleIds,
  };
}

export function canAssignPassenger(input: {
  authorizedCapacity: number;
  currentlyAssigned: number;
}): boolean {
  return input.currentlyAssigned + 1 <= input.authorizedCapacity;
}
