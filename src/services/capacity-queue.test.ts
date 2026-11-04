import { beforeEach, describe, expect, it } from "vitest";
import { buildCapacityQueue } from "@/services/capacity-queue";
import { planOperationFacade } from "@/services/operations-facade";
import { resetDb } from "@/services/local/db";
import { setSessionRole } from "@/services/operations-service";

describe("capacity-queue", () => {
  beforeEach(() => {
    resetDb();
    setSessionRole("planner");
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  });

  it("lista vacía cuando la planificación cubre cupo", async () => {
    const date = new Date().toISOString().slice(0, 10);
    await planOperationFacade({ date, shiftCode: "A" });
    const queue = await buildCapacityQueue(date);
    expect(queue.date).toBe(date);
    expect(queue.totalUnassigned).toBe(0);
  });
});
