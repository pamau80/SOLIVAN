import { afterEach, describe, expect, it, vi } from "vitest";
import {
  findLocalUser,
  isLocalAuthConfigured,
  listExposedLocalUsers,
  listLocalUsers,
} from "./local-users";

const ORIGINAL = {
  users: process.env.SOLIVAN_LOCAL_USERS,
  expose: process.env.SOLIVAN_EXPOSE_DEMO_USERS,
};

afterEach(() => {
  vi.unstubAllEnvs();
  if (ORIGINAL.users === undefined) delete process.env.SOLIVAN_LOCAL_USERS;
  else process.env.SOLIVAN_LOCAL_USERS = ORIGINAL.users;
  if (ORIGINAL.expose === undefined) delete process.env.SOLIVAN_EXPOSE_DEMO_USERS;
  else process.env.SOLIVAN_EXPOSE_DEMO_USERS = ORIGINAL.expose;
});

describe("local-users", () => {
  it("sin SOLIVAN_LOCAL_USERS no hay usuarios", () => {
    delete process.env.SOLIVAN_LOCAL_USERS;
    expect(listLocalUsers()).toEqual([]);
    expect(findLocalUser("a@b.cl", "x")).toBeNull();
    expect(isLocalAuthConfigured()).toBe(false);
  });

  it("isLocalAuthConfigured es true con usuarios válidos", () => {
    process.env.SOLIVAN_LOCAL_USERS = JSON.stringify([
      {
        email: "a@b.cl",
        password: "secret-value",
        role: "admin",
      },
    ]);
    expect(isLocalAuthConfigured()).toBe(true);
  });

  it("carga usuarios desde JSON de entorno", () => {
    process.env.SOLIVAN_LOCAL_USERS = JSON.stringify([
      {
        email: "Planner@Example.com",
        password: "one-time-test-password",
        fullName: "Planner",
        role: "planner",
      },
    ]);
    const users = listLocalUsers();
    expect(users).toHaveLength(1);
    expect(users[0]?.email).toBe("planner@example.com");
    expect(users[0]?.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
    expect(findLocalUser("planner@example.com", "one-time-test-password")).not.toBeNull();
    expect(findLocalUser("planner@example.com", "wrong")).toBeNull();
  });

  it("no expone listado en producción aunque el flag esté activo", () => {
    process.env.SOLIVAN_LOCAL_USERS = JSON.stringify([
      {
        email: "a@b.cl",
        password: "secret-value",
        role: "admin",
      },
    ]);
    process.env.SOLIVAN_EXPOSE_DEMO_USERS = "true";
    vi.stubEnv("NODE_ENV", "production");
    expect(listExposedLocalUsers()).toEqual([]);
  });

  it("expone emails sin passwords solo con opt-in fuera de producción", () => {
    process.env.SOLIVAN_LOCAL_USERS = JSON.stringify([
      {
        email: "a@b.cl",
        password: "secret-value",
        role: "admin",
      },
    ]);
    process.env.SOLIVAN_EXPOSE_DEMO_USERS = "true";
    vi.stubEnv("NODE_ENV", "development");
    expect(listExposedLocalUsers()).toEqual([{ email: "a@b.cl", role: "admin" }]);
  });
});
