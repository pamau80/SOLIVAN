import { beforeEach, describe, expect, it } from "vitest";
import {
  deactivatePerson,
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

  it("desactiva persona y la saca del listado activo", () => {
    const person = listPersons()[0];
    deactivatePerson(person.id);
    expect(listPersons().some((p) => p.id === person.id)).toBe(false);
  });
});
