import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getDb, resetDb } from "@/services/local/db";
import {
  commitImport,
  createPlannedOperation,
  createException,
  previewImport,
  setSessionRole,
} from "@/services/operations-service";

describe("operations-service", () => {
  beforeEach(() => {
    resetDb();
    setSessionRole("planner");
  });

  afterEach(() => {
    setSessionRole("planner");
  });

  it("detecta duplicados en preview de importación", () => {
    const preview = previewImport({
      filename: "test.csv",
      mapping: {
        externalId: "id",
        fullName: "nombre",
        transportCondition: "usa",
      },
      rows: [
        { id: "TRB-X1", nombre: "Uno", usa: "si" },
        { id: "TRB-X1", nombre: "Uno dup", usa: "si" },
      ],
    });
    expect(preview.duplicateCount).toBe(1);
  });

  it("planifica operación respetando habituales y genera viajes", () => {
    const { operation, plan } = createPlannedOperation({
      date: "2026-11-04",
      shiftCode: "A",
    });
    expect(operation.status).toBe("planned");
    expect(plan.trips.length).toBeGreaterThan(0);
    expect(plan.eligible.length).toBeGreaterThan(0);
  });

  it("exige motivo en excepciones", () => {
    const { operation } = createPlannedOperation({
      date: "2026-11-05",
      shiftCode: "A",
    });
    const detailPassengerId = resetAndGetPassenger(operation.id);
    expect(() =>
      createException({
        operationId: operation.id,
        operationPassengerId: detailPassengerId,
        newVehicleId: "33333333-3333-3333-3333-333333333302",
        reason: "   ",
      }),
    ).toThrow(/motivo/i);
  });

  it("bloquea escritura para viewer", () => {
    setSessionRole("viewer");
    expect(() =>
      commitImport({
        filename: "x.csv",
        mapping: { externalId: "id", fullName: "nombre" },
        rows: [{ id: "A", nombre: "B" }],
      }),
    ).toThrow(/viewer/i);
  });
});

function resetAndGetPassenger(operationId: string) {
  const passenger = getDb().operationPassengers.find(
    (p) => p.operationId === operationId,
  );
  if (!passenger) throw new Error("sin pasajero");
  return passenger.id;
}
