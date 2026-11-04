import { beforeEach, describe, expect, it } from "vitest";
import {
  listHabitualFacade,
  listPersonsFacade,
  upsertAddressFacade,
  upsertPersonFacade,
} from "@/services/catalog-facade";
import { resetDb } from "@/services/local/db";
import { setSessionRole } from "@/services/operations-service";
import { TransportCondition } from "@/domain/types";

describe("catalog-facade (modo local)", () => {
  beforeEach(() => {
    resetDb();
    setSessionRole("planner");
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  });

  it("lista personas desde store local", async () => {
    const persons = await listPersonsFacade();
    expect(persons.length).toBeGreaterThan(0);
  });

  it("crea persona y dirección vía fachada", async () => {
    const person = await upsertPersonFacade({
      externalId: "T-FACADE-1",
      fullName: "Test Facade",
      transportCondition: TransportCondition.UsesTransport,
    });
    expect(person.externalId).toBe("T-FACADE-1");

    const address = await upsertAddressFacade({
      streetLine: "Calle Facade 1",
    });
    expect(address.streetLine).toBe("Calle Facade 1");

    const habitual = await listHabitualFacade();
    expect(Array.isArray(habitual)).toBe(true);
  });
});
