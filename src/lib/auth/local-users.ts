import { createHash } from "node:crypto";
import { AppRole } from "@/domain/types";

export type LocalAuthUser = {
  id: string;
  email: string;
  password: string;
  fullName: string;
  role: AppRole;
};

const ROLE_VALUES = new Set<string>(Object.values(AppRole));

/** Cuentas de muestra solo cuando no hay SOLIVAN_LOCAL_USERS. */
export const SAMPLE_LOCAL_USERS: LocalAuthUser[] = [
  {
    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1",
    email: "planificador@solivan.local",
    password: "solivan-demo",
    fullName: "Planificador Demo",
    role: AppRole.Planner,
  },
  {
    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2",
    email: "admin@solivan.local",
    password: "solivan-admin",
    fullName: "Administrador Demo",
    role: AppRole.Admin,
  },
  {
    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3",
    email: "operador@solivan.local",
    password: "solivan-oper",
    fullName: "Operador Demo",
    role: AppRole.Operator,
  },
  {
    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4",
    email: "visor@solivan.local",
    password: "solivan-view",
    fullName: "Visor Demo",
    role: AppRole.Viewer,
  },
];

function stableLocalUserId(email: string): string {
  const hex = createHash("sha256").update(`solivan-local:${email}`).digest("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

function parseEnvUsers(raw: string): LocalAuthUser[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("SOLIVAN_LOCAL_USERS debe ser JSON válido");
  }

  if (!Array.isArray(parsed)) {
    throw new Error("SOLIVAN_LOCAL_USERS debe ser un arreglo JSON");
  }

  return parsed.map((entry, index) => {
    if (!entry || typeof entry !== "object") {
      throw new Error(`SOLIVAN_LOCAL_USERS[${index}] inválido`);
    }
    const row = entry as Record<string, unknown>;
    const email =
      typeof row.email === "string" ? row.email.trim().toLowerCase() : "";
    const password = typeof row.password === "string" ? row.password : "";
    const fullName =
      typeof row.fullName === "string" && row.fullName.trim()
        ? row.fullName.trim()
        : email;
    const role = typeof row.role === "string" ? row.role : "";
    const id =
      typeof row.id === "string" && row.id.trim()
        ? row.id.trim()
        : email
          ? stableLocalUserId(email)
          : "";

    if (!email || !password) {
      throw new Error(
        `SOLIVAN_LOCAL_USERS[${index}] requiere email y password`,
      );
    }
    if (!ROLE_VALUES.has(role)) {
      throw new Error(
        `SOLIVAN_LOCAL_USERS[${index}] role inválido (admin|planner|operator|viewer)`,
      );
    }

    return {
      id,
      email,
      password,
      fullName,
      role: role as AppRole,
    };
  });
}

/**
 * Usuarios locales: `SOLIVAN_LOCAL_USERS` si está definido; si no, cuentas de muestra.
 */
export function listLocalUsers(): LocalAuthUser[] {
  const raw = process.env.SOLIVAN_LOCAL_USERS?.trim();
  if (!raw) return SAMPLE_LOCAL_USERS.map((u) => ({ ...u }));
  return parseEnvUsers(raw);
}

export function usesSampleLocalUsers(): boolean {
  return !process.env.SOLIVAN_LOCAL_USERS?.trim();
}

export function findLocalUser(email: string, password: string) {
  const normalized = email.trim().toLowerCase();
  return (
    listLocalUsers().find(
      (user) => user.email === normalized && user.password === password,
    ) ?? null
  );
}

export function isLocalAuthConfigured(): boolean {
  try {
    return listLocalUsers().length > 0;
  } catch {
    return false;
  }
}

/** Emails/roles para la UI de login (incluye passwords solo en cuentas de muestra). */
export function listExposedLocalUsers(): Array<{
  email: string;
  role: AppRole;
  password?: string;
}> {
  if (usesSampleLocalUsers()) {
    return SAMPLE_LOCAL_USERS.map(({ email, role, password }) => ({
      email,
      role,
      password,
    }));
  }

  const allow =
    process.env.SOLIVAN_EXPOSE_DEMO_USERS === "true" &&
    process.env.NODE_ENV !== "production";
  if (!allow) return [];
  return listLocalUsers().map(({ email, role }) => ({ email, role }));
}
