import { describe, expect, it } from "vitest";
import { TransportCondition } from "../types";
import type { HabitualAssignment, Person } from "../types";
import {
  filterEligibleForPlanning,
  identifyPersons,
} from "./identification";

const person: Person = {
  id: "p1",
  externalId: "TRB-1",
  nationalId: "1-9",
  fullName: "Ana",
  transportCondition: TransportCondition.UsesTransport,
  phone: null,
  email: null,
  addressId: null,
  notes: null,
  isActive: true,
};

const habitual: HabitualAssignment = {
  id: "h1",
  personId: "p1",
  providerId: "prov",
  vehicleId: "veh",
  zoneId: "z1",
  sectorId: null,
  shiftCode: "A",
  pickupNotes: null,
  validFrom: "2026-01-01",
  validTo: null,
  isCurrent: true,
};

describe("identifyPersons", () => {
  it("identifica persona existente y detecta duplicados en lote", () => {
    const results = identifyPersons({
      rows: [
        {
          rowNumber: 1,
          externalId: "trb-1",
          fullName: "Ana",
        },
        {
          rowNumber: 2,
          externalId: "TRB-1",
          fullName: "Ana repetida",
        },
        {
          rowNumber: 3,
          externalId: "TRB-NEW",
          fullName: "Nueva",
          transportCondition: TransportCondition.UsesTransport,
        },
      ],
      existingPersons: [person],
      habitualByPersonId: new Map([["p1", habitual]]),
    });

    expect(results[0].matchedPerson?.id).toBe("p1");
    expect(results[0].isNewPerson).toBe(false);
    expect(results[1].isDuplicateInBatch).toBe(true);
    expect(results[2].isNewPerson).toBe(true);
    expect(results[2].issues.some((i) => i.code === "incomplete_for_planning")).toBe(
      true,
    );
  });

  it("es determinista ante los mismos inputs", () => {
    const input = {
      rows: [
        { rowNumber: 1, externalId: "A", fullName: "Uno" },
        { rowNumber: 2, externalId: "B", fullName: "Dos" },
      ],
      existingPersons: [] as Person[],
      habitualByPersonId: new Map<string, HabitualAssignment>(),
    };

    expect(identifyPersons(input)).toEqual(identifyPersons(input));
  });
});

describe("filterEligibleForPlanning", () => {
  it("solo incluye quienes usan transporte sin errores bloqueantes", () => {
    const results = identifyPersons({
      rows: [
        {
          rowNumber: 1,
          externalId: "TRB-1",
          fullName: "Ana",
          transportCondition: TransportCondition.UsesTransport,
        },
        {
          rowNumber: 2,
          externalId: "TRB-2",
          fullName: "Sin transporte",
          transportCondition: TransportCondition.NoTransport,
        },
      ],
      existingPersons: [person],
      habitualByPersonId: new Map([["p1", habitual]]),
    });

    const eligible = filterEligibleForPlanning(results);
    expect(eligible).toHaveLength(1);
    expect(eligible[0].externalId).toBe("TRB-1");
  });
});
