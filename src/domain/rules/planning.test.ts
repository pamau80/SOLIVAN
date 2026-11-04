import { describe, expect, it } from "vitest";
import { TransportCondition, VehicleStatus } from "../types";
import type { HabitualAssignment, Person, Vehicle } from "../types";
import { authorizeException, planOperation } from "./planning";

const vehicleV1: Vehicle = {
  id: "veh-1",
  providerId: "prov-1",
  plate: "ABCD12",
  label: "Van 1",
  authorizedCapacity: 2,
  status: VehicleStatus.Available,
  isActive: true,
};

function person(
  id: string,
  externalId: string,
  condition: (typeof TransportCondition)[keyof typeof TransportCondition] = TransportCondition.UsesTransport,
): Person {
  return {
    id,
    externalId,
    nationalId: null,
    fullName: externalId,
    transportCondition: condition,
    phone: null,
    email: null,
    addressId: null,
    notes: null,
    isActive: true,
  };
}

function habitual(
  personId: string,
  vehicleId: string | null,
): HabitualAssignment {
  return {
    id: `h-${personId}`,
    personId,
    providerId: vehicleId ? "prov-1" : null,
    vehicleId,
    zoneId: "z1",
    sectorId: null,
    shiftCode: "A",
    pickupNotes: null,
    validFrom: "2026-01-01",
    validTo: null,
    isCurrent: true,
  };
}

describe("planOperation", () => {
  it("asigna pasajeros al vehículo habitual respetando cupo", () => {
    const p1 = person("p1", "TRB-1");
    const p2 = person("p2", "TRB-2");
    const h1 = habitual("p1", "veh-1");
    const h2 = habitual("p2", "veh-1");

    const result = planOperation({
      date: "2026-11-04",
      shiftCode: "A",
      rows: [
        {
          rowNumber: 1,
          externalId: "TRB-1",
          fullName: "Uno",
          transportCondition: TransportCondition.UsesTransport,
        },
        {
          rowNumber: 2,
          externalId: "TRB-2",
          fullName: "Dos",
          transportCondition: TransportCondition.UsesTransport,
        },
      ],
      existingPersons: [p1, p2],
      habitualByPersonId: new Map([
        ["p1", h1],
        ["p2", h2],
      ]),
      vehicles: [vehicleV1],
    });

    expect(result.eligible).toHaveLength(2);
    expect(result.trips).toHaveLength(1);
    expect(result.trips[0]).toMatchObject({
      vehicleId: "veh-1",
      providerId: "prov-1",
      sequenceNumber: 1,
      plannedCapacity: 2,
    });
    expect(result.trips[0].passengerExternalIds).toEqual(["TRB-1", "TRB-2"]);
    expect(result.unassignedExternalIds).toEqual([]);
    expect(h1.vehicleId).toBe("veh-1");
    expect(h2.vehicleId).toBe("veh-1");
  });

  it("deja pendientes cuando hay sobrecupo del vehículo habitual", () => {
    const people = [
      person("p1", "TRB-1"),
      person("p2", "TRB-2"),
      person("p3", "TRB-3"),
    ];
    const habitualByPersonId = new Map(
      people.map((p) => [p.id, habitual(p.id, "veh-1")]),
    );

    const result = planOperation({
      date: "2026-11-04",
      shiftCode: "A",
      rows: people.map((p, index) => ({
        rowNumber: index + 1,
        externalId: p.externalId,
        fullName: p.fullName,
        transportCondition: TransportCondition.UsesTransport,
      })),
      existingPersons: people,
      habitualByPersonId,
      vehicles: [vehicleV1],
    });

    expect(result.trips).toHaveLength(1);
    expect(result.trips[0].passengerExternalIds).toHaveLength(2);
    expect(result.unassignedExternalIds).toEqual(["TRB-3"]);
    expect(result.warnings.some((w) => w.includes("pendientes"))).toBe(true);
    expect(result.capacity.unassignedPassengers).toBeGreaterThan(0);
  });
});

describe("authorizeException", () => {
  it("requiere motivo no vacío", () => {
    expect(authorizeException({ reason: "" })).toEqual({
      ok: false,
      error: "El motivo de la excepción es obligatorio",
    });
    expect(authorizeException({ reason: "   " })).toEqual({
      ok: false,
      error: "El motivo de la excepción es obligatorio",
    });
    expect(authorizeException({ reason: "Cambio de turno autorizado" })).toEqual(
      { ok: true },
    );
  });
});
