import { summarizeCapacity } from "@/domain/rules";
import { VehicleStatus } from "@/domain/types";
import { getDb } from "@/services/local/db";

export type OperationReportRow = {
  operationId: string;
  date: string;
  shiftCode: string;
  status: string;
  passengers: number;
  assigned: number;
  transported: number;
  absent: number;
  unassigned: number;
  trips: number;
  exceptions: number;
  incidents: number;
  occupancyPercent: number;
};

export function buildOperationalReport(filters?: {
  from?: string;
  to?: string;
  shiftCode?: string;
}): {
  rows: OperationReportRow[];
  totals: {
    operations: number;
    passengers: number;
    transported: number;
    absent: number;
    exceptions: number;
    incidents: number;
    avgOccupancyPercent: number;
  };
} {
  const db = getDb();
  const shiftsById = new Map(db.shifts.map((s) => [s.id, s]));

  const rows: OperationReportRow[] = db.operations
    .filter((op) => {
      if (filters?.from && op.operationDate < filters.from) return false;
      if (filters?.to && op.operationDate > filters.to) return false;
      if (filters?.shiftCode) {
        const shift = shiftsById.get(op.shiftId);
        if (!shift || shift.code !== filters.shiftCode) return false;
      }
      return true;
    })
    .map((op) => {
      const shift = shiftsById.get(op.shiftId);
      const passengers = db.operationPassengers.filter(
        (p) => p.operationId === op.id,
      );
      const trips = db.trips.filter((t) => t.operationId === op.id);
      const assignments = db.tripAssignments.filter((ta) =>
        trips.some((t) => t.id === ta.tripId),
      );
      const assignedByVehicle = new Map<string, number>();
      for (const trip of trips) {
        const count = assignments.filter((a) => a.tripId === trip.id).length;
        assignedByVehicle.set(
          trip.vehicleId,
          (assignedByVehicle.get(trip.vehicleId) ?? 0) + count,
        );
      }

      const capacity = summarizeCapacity({
        passengersScheduled: passengers.length,
        vehicles: db.vehicles
          .filter((v) => v.isActive && v.status === VehicleStatus.Available)
          .map((vehicle) => ({
            vehicle,
            assignedPassengers: assignedByVehicle.get(vehicle.id) ?? 0,
          })),
      });

      return {
        operationId: op.id,
        date: op.operationDate,
        shiftCode: shift?.code ?? "?",
        status: op.status,
        passengers: passengers.length,
        assigned: passengers.filter((p) =>
          ["assigned", "transported", "reassigned"].includes(p.executionStatus),
        ).length,
        transported: passengers.filter((p) => p.executionStatus === "transported")
          .length,
        absent: passengers.filter((p) => p.executionStatus === "absent").length,
        unassigned: Math.max(0, passengers.length - assignments.length),
        trips: trips.length,
        exceptions: db.exceptions.filter((e) => e.operationId === op.id).length,
        incidents: db.incidents.filter((i) => i.operationId === op.id).length,
        occupancyPercent: capacity.occupancyPercent,
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));

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
