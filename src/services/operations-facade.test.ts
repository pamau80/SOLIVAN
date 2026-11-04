import { beforeEach, describe, expect, it } from "vitest";
import {
  buildOperationalReportFacade,
  getDashboardStatsFacade,
  listOperationsFacade,
  planOperationFacade,
} from "@/services/operations-facade";
import { resetDb } from "@/services/local/db";
import { setSessionRole } from "@/services/operations-service";

describe("operations-facade (modo local)", () => {
  beforeEach(() => {
    resetDb();
    setSessionRole("planner");
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  });

  it("planifica y lista operaciones", async () => {
    const date = new Date().toISOString().slice(0, 10);
    const result = await planOperationFacade({ date, shiftCode: "A" });
    expect(result.operation.operationDate).toBe(date);
    expect(result.plan.trips.length).toBeGreaterThan(0);

    const list = await listOperationsFacade();
    expect(list.operations.some((o) => o.id === result.operation.id)).toBe(true);
  });

  it("arma dashboard y reporte", async () => {
    const date = new Date().toISOString().slice(0, 10);
    await planOperationFacade({ date, shiftCode: "A" });
    const stats = await getDashboardStatsFacade();
    expect(stats.operations).toBeGreaterThan(0);
    const report = await buildOperationalReportFacade();
    expect(report.totals.operations).toBeGreaterThan(0);
  });
});
