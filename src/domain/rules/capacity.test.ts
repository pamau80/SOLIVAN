import { describe, expect, it } from "vitest";
import { VehicleStatus } from "../types";
import type { Vehicle } from "../types";
import { canAssignPassenger, summarizeCapacity } from "./capacity";

function vehicle(
  id: string,
  capacity: number,
  status: (typeof VehicleStatus)[keyof typeof VehicleStatus] = VehicleStatus.Available,
): Vehicle {
  return {
    id,
    providerId: "p",
    plate: id,
    label: id,
    authorizedCapacity: capacity,
    status,
    isActive: true,
  };
}

describe("summarizeCapacity", () => {
  it("calcula déficit y sobrecupo sin confundir mínimo teórico con flota física", () => {
    const summary = summarizeCapacity({
      passengersScheduled: 40,
      vehicles: [
        { vehicle: vehicle("v1", 15), assignedPassengers: 15 },
        { vehicle: vehicle("v2", 12), assignedPassengers: 14 },
        {
          vehicle: vehicle("v3", 25, VehicleStatus.Maintenance),
          assignedPassengers: 0,
        },
      ],
    });

    expect(summary.vehiclesAvailable).toBe(2);
    expect(summary.totalAvailableCapacity).toBe(27);
    expect(summary.occupiedCapacity).toBe(29);
    expect(summary.overloadedVehicleIds).toEqual(["v2"]);
    expect(summary.vehiclesRequiredTheoreticalMin).toBe(Math.ceil(40 / 15));
    expect(summary.capacityDeficit).toBeGreaterThan(0);
  });
});

describe("canAssignPassenger", () => {
  it("impide superar capacidad autorizada", () => {
    expect(
      canAssignPassenger({ authorizedCapacity: 12, currentlyAssigned: 12 }),
    ).toBe(false);
    expect(
      canAssignPassenger({ authorizedCapacity: 12, currentlyAssigned: 11 }),
    ).toBe(true);
  });
});
