import { beforeEach, describe, expect, it } from "vitest";
import { resetDb } from "@/services/local/db";
import {
  createPlannedOperation,
  setSessionRole,
} from "@/services/operations-service";
import { buildOperationalReport } from "@/services/reports-service";

describe("buildOperationalReport", () => {
  beforeEach(() => {
    resetDb();
    setSessionRole("planner");
  });

  it("agrega métricas por operación planificada", () => {
    createPlannedOperation({ date: "2026-11-10", shiftCode: "A" });
    const report = buildOperationalReport({ from: "2026-11-01", to: "2026-11-30" });
    expect(report.totals.operations).toBe(1);
    expect(report.rows[0]?.passengers).toBeGreaterThan(0);
    expect(report.rows[0]?.trips).toBeGreaterThan(0);
    expect(report.totals.avgOccupancyPercent).toBeGreaterThanOrEqual(0);
  });

  it("filtra por turno", () => {
    createPlannedOperation({ date: "2026-11-11", shiftCode: "A" });
    const onlyB = buildOperationalReport({ shiftCode: "B" });
    expect(onlyB.totals.operations).toBe(0);
  });
});
