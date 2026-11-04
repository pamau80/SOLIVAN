import type { IdentifiedPersonResult } from "./identification";

export interface GroupingKey {
  date: string;
  shiftCode: string;
  habitualVehicleId: string | null;
  zoneId: string | null;
  sectorId: string | null;
}

export interface PassengerGroup {
  key: GroupingKey;
  keyId: string;
  members: IdentifiedPersonResult[];
}

function stableKey(key: GroupingKey): string {
  return [
    key.date,
    key.shiftCode,
    key.habitualVehicleId ?? "-",
    key.zoneId ?? "-",
    key.sectorId ?? "-",
  ].join("|");
}

/**
 * Agrupación reproducible: mismos datos y parámetros → mismo resultado.
 */
export function groupForPlanning(input: {
  date: string;
  shiftCode: string;
  persons: IdentifiedPersonResult[];
}): PassengerGroup[] {
  const groups = new Map<string, PassengerGroup>();

  const sorted = [...input.persons].sort((a, b) => {
    if (a.externalId !== b.externalId) {
      return a.externalId.localeCompare(b.externalId);
    }
    return a.rowNumber - b.rowNumber;
  });

  for (const person of sorted) {
    const key: GroupingKey = {
      date: input.date,
      shiftCode: input.shiftCode,
      habitualVehicleId: person.habitualAssignment?.vehicleId ?? null,
      zoneId: person.habitualAssignment?.zoneId ?? null,
      sectorId: person.habitualAssignment?.sectorId ?? null,
    };
    const keyId = stableKey(key);
    const existing = groups.get(keyId);
    if (existing) {
      existing.members.push(person);
    } else {
      groups.set(keyId, { key, keyId, members: [person] });
    }
  }

  return [...groups.values()].sort((a, b) => a.keyId.localeCompare(b.keyId));
}
