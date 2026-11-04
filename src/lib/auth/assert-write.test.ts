import { describe, expect, it } from "vitest";
import { assertSessionCanWrite } from "@/lib/auth/assert-write";
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

  it("bloquea viewer", () => {
    expect(() => assertSessionCanWrite(session("viewer"))).toThrow(
      /solo lectura/i,
    );
  });
});
