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

function stableLocalUserId(email: string): string {
  const hex = createHash("sha256").update(`solivan-local:${email}`).digest("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

/**
 * Usuarios de autenticación local. Solo desde `SOLIVAN_LOCAL_USERS` (JSON).
 * Sin esa variable, el login local rechaza cualquier credencial.
 * Nunca incluir passwords en el código fuente.
 */
export function listLocalUsers(): LocalAuthUser[] {
  const raw = process.env.SOLIVAN_LOCAL_USERS?.trim();
  if (!raw) return [];

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

export function findLocalUser(email: string, password: string) {
  const normalized = email.trim().toLowerCase();
  return (
    listLocalUsers().find(
      (user) => user.email === normalized && user.password === password,
    ) ?? null
  );
}

/** Listado público (sin passwords) solo con opt-in explícito fuera de producción. */
export function listExposedLocalUsers(): Array<{
  email: string;
  role: AppRole;
}> {
  const allow =
    process.env.SOLIVAN_EXPOSE_DEMO_USERS === "true" &&
    process.env.NODE_ENV !== "production";
  if (!allow) return [];
  return listLocalUsers().map(({ email, role }) => ({ email, role }));
}
