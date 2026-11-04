import { describe, expect, it } from "vitest";
import { TransportCondition } from "../types";
import type { HabitualAssignment } from "../types";
import type { IdentifiedPersonResult } from "./identification";
import { groupForPlanning } from "./grouping";

function result(
  externalId: string,
  vehicleId: string | null,
  zoneId: string | null,
): IdentifiedPersonResult {
  const habitual: HabitualAssignment | null = vehicleId
    ? {
        id: `h-${externalId}`,
        personId: `p-${externalId}`,
        providerId: "prov",
        vehicleId,
        zoneId,
        sectorId: null,
        shiftCode: "A",
        pickupNotes: null,
        validFrom: "2026-01-01",
        validTo: null,
        isCurrent: true,
      }
    : null;

  return {
    rowNumber: Number(externalId.replace(/\D/g, "") || 1),
    externalId,
    fullName: externalId,
    matchedPerson: null,
    isNewPerson: true,
    isDuplicateInBatch: false,
    issues: [],
    transportCondition: TransportCondition.UsesTransport,
    habitualAssignment: habitual,
  };
}

describe("groupForPlanning", () => {
  it("agrupa de forma estable e independiente del orden de entrada", () => {
    const a = result("C", "v1", "z1");
    const b = result("A", "v1", "z1");
    const c = result("B", "v2", "z1");

    const g1 = groupForPlanning({
      date: "2026-11-04",
      shiftCode: "A",
      persons: [a, b, c],
    });
    const g2 = groupForPlanning({
      date: "2026-11-04",
      shiftCode: "A",
      persons: [c, a, b],
    });

    expect(g1.map((g) => g.keyId)).toEqual(g2.map((g) => g.keyId));
    expect(g1[0].members.map((m) => m.externalId)).toEqual(
      g2[0].members.map((m) => m.externalId),
    );
    expect(g1).toHaveLength(2);
  });
});
