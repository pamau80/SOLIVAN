import { ok } from "@/lib/api";
import { getAppEnv } from "@/lib/env";
import { getDb } from "@/services/local/db";

export async function GET() {
  const env = getAppEnv();
  const db = env.runtimeMode === "local" ? getDb() : null;
  return ok({
    status: "ok",
    runtimeMode: env.runtimeMode,
    supabaseConfigured: env.isSupabaseConfigured,
    local: db
      ? {
          persons: db.persons.length,
          vehicles: db.vehicles.length,
          operations: db.operations.length,
          sessionRole: db.session.role,
        }
      : null,
    time: new Date().toISOString(),
  });
}
