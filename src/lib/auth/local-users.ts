import { AppRole } from "@/domain/types";

/**
 * Credenciales solo para modo local/demo.
 * En producción se usa Supabase Auth; no reutilizar estas claves.
 */
export const LOCAL_DEMO_USERS = [
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
] as const;

export function findLocalUser(email: string, password: string) {
  const normalized = email.trim().toLowerCase();
  return (
    LOCAL_DEMO_USERS.find(
      (user) =>
        user.email === normalized && user.password === password,
    ) ?? null
  );
}
