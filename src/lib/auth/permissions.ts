import { AppRole } from "@/domain/types";
import type { SessionPayload } from "@/lib/auth/types";
import { AuthorizationError } from "@/lib/auth/errors";

/** Acciones alineadas a la matriz RLS / gobernanza operacional. */
export type PermissionAction =
  | "catalog.write" // geografía / flota
  | "persons.write"
  | "habitual.write"
  | "import.write"
  | "operations.plan"
  | "operations.confirm"
  | "operations.exception"
  | "operations.execution"
  | "operations.incident"
  | "admin.read"
  | "admin.exportAudit"
  | "admin.setRole"
  | "admin.resetDemo";

const ROLE_PERMISSIONS: Record<AppRole, ReadonlySet<PermissionAction>> = {
  [AppRole.Admin]: new Set([
    "catalog.write",
    "persons.write",
    "habitual.write",
    "import.write",
    "operations.plan",
    "operations.confirm",
    "operations.exception",
    "operations.execution",
    "operations.incident",
    "admin.read",
    "admin.exportAudit",
    "admin.setRole",
    "admin.resetDemo",
  ]),
  [AppRole.Planner]: new Set([
    "catalog.write",
    "persons.write",
    "habitual.write",
    "import.write",
    "operations.plan",
    "operations.confirm",
    "operations.exception",
    "operations.execution",
    "operations.incident",
    "admin.read",
    "admin.exportAudit",
    // setRole/resetDemo solo admin (ya no planner)
  ]),
  [AppRole.Operator]: new Set([
    "persons.write",
    "operations.execution",
    "operations.incident",
  ]),
  [AppRole.Viewer]: new Set(),
};

export function roleHasPermission(
  role: AppRole,
  action: PermissionAction,
): boolean {
  return ROLE_PERMISSIONS[role]?.has(action) ?? false;
}

export function assertPermission(
  session: SessionPayload,
  action: PermissionAction,
) {
  if (!roleHasPermission(session.role, action)) {
    throw new AuthorizationError(
      `Rol ${session.role}: sin permiso para ${action}`,
    );
  }
}

/** Compat: cualquier write de negocio excepto viewer. Preferir assertPermission. */
export function assertSessionCanWrite(session: SessionPayload) {
  if (session.role === AppRole.Viewer) {
    throw new AuthorizationError("Rol viewer: solo lectura");
  }
}
