import { describe, expect, it } from "vitest";
import {
  importPostSchema,
  operationsPostSchema,
} from "@/domain/schemas/operations";
import { fleetPostSchema, geographyPostSchema } from "@/domain/schemas/catalog";

describe("schemas API", () => {
  it("valida plan y rechaza fecha inválida", () => {
    expect(
      operationsPostSchema.parse({
        action: "plan",
        date: "2026-11-04",
        shiftCode: "A",
      }).action,
    ).toBe("plan");
    expect(() =>
      operationsPostSchema.parse({
        action: "plan",
        date: "04-11-2026",
        shiftCode: "A",
      }),
    ).toThrow();
  });

  it("valida baja de flota/zona", () => {
    const fleet = fleetPostSchema.parse({
      entity: "vehicle",
      action: "deactivate",
      id: "33333333-3333-3333-3333-333333333301",
    });
    expect("action" in fleet && fleet.action).toBe("deactivate");
    const geo = geographyPostSchema.parse({
      entity: "zone",
      action: "deactivate",
      id: "22222222-2222-2222-2222-222222222201",
    });
    expect("action" in geo && geo.action).toBe("deactivate");
  });

  it("exige filas en import", () => {
    expect(() =>
      importPostSchema.parse({
        action: "preview",
        filename: "x.csv",
        mapping: {},
        rows: [],
      }),
    ).toThrow();
  });
});
