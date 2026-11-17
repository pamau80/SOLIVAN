import { describe, expect, it } from "vitest";
import {
  assertPermission,
  assertSessionCanWrite,
  roleHasPermission,
} from "@/lib/auth/assert-write";
import { AuthorizationError } from "@/lib/auth/errors";
import type { SessionPayload } from "@/lib/auth/types";

function session(role: SessionPayload["role"]): SessionPayload {
  return {
    userId: "u1",
    email: "t@example.com",
    fullName: "Test",
    role,
    mode: "local",
    exp: Math.floor(Date.now() / 1000) + 3600,
  };
}

describe("assertSessionCanWrite", () => {
  it("permite planner/admin/operator", () => {
    expect(() => assertSessionCanWrite(session("planner"))).not.toThrow();
    expect(() => assertSessionCanWrite(session("admin"))).not.toThrow();
    expect(() => assertSessionCanWrite(session("operator"))).not.toThrow();
  });

  it("bloquea viewer con AuthorizationError", () => {
    expect(() => assertSessionCanWrite(session("viewer"))).toThrow(
      AuthorizationError,
    );
  });
});

describe("permissions matrix", () => {
  it("operator no planifica ni escribe catálogo", () => {
    expect(roleHasPermission("operator", "operations.plan")).toBe(false);
    expect(roleHasPermission("operator", "catalog.write")).toBe(false);
    expect(roleHasPermission("operator", "operations.execution")).toBe(true);
    expect(() =>
      assertPermission(session("operator"), "operations.plan"),
    ).toThrow(/sin permiso/i);
  });

  it("planner no puede setRole; admin sí", () => {
    expect(roleHasPermission("planner", "admin.setRole")).toBe(false);
    expect(roleHasPermission("admin", "admin.setRole")).toBe(true);
    expect(roleHasPermission("planner", "admin.read")).toBe(true);
    expect(roleHasPermission("viewer", "admin.read")).toBe(false);
  });
});
