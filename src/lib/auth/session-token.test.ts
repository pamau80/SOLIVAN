import { describe, expect, it } from "vitest";
import { createSessionToken, parseSessionToken } from "./session-token";
import { AppRole } from "@/domain/types";

describe("session-token", () => {
  it("firma y valida un token de sesión", async () => {
    const token = await createSessionToken({
      userId: "u1",
      email: "a@b.cl",
      fullName: "Ana",
      role: AppRole.Planner,
      mode: "local",
    });
    const parsed = await parseSessionToken(token);
    expect(parsed?.email).toBe("a@b.cl");
    expect(parsed?.role).toBe(AppRole.Planner);
  });

  it("rechaza tokens adulterados", async () => {
    const token = await createSessionToken({
      userId: "u1",
      email: "a@b.cl",
      fullName: "Ana",
      role: AppRole.Viewer,
      mode: "local",
    });
    const bad = `${token.slice(0, -2)}xx`;
    expect(await parseSessionToken(bad)).toBeNull();
  });
});
