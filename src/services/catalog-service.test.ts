import { beforeEach, describe, expect, it } from "vitest";
import {
  linkPersonAddress,
  listPersons,
  upsertAddress,
} from "@/services/catalog-service";
import { resetDb } from "@/services/local/db";
import { setSessionRole } from "@/services/operations-service";

describe("addresses", () => {
  beforeEach(() => {
    resetDb();
    setSessionRole("planner");
  });

  it("crea dirección y la vincula a una persona", () => {
    const address = upsertAddress({
      streetLine: "Av. Providencia 100",
      reference: "Metro",
    });
    const person = listPersons()[0];
    const linked = linkPersonAddress(person.id, address.id);
    expect(linked.addressId).toBe(address.id);
  });
});
