import { ok } from "@/lib/api";
import { getAppEnv } from "@/lib/env";
import { getDb } from "@/services/local/db";

export async function GET() {
  const env = getAppEnv();
  const db = env.runtimeMode === "local" ? getDb() : null;

  let supabasePing: "ok" | "error" | "skipped" = "skipped";
  if (env.runtimeMode === "supabase") {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const { error } = await supabase.from("shifts").select("id").limit(1);
      supabasePing = error ? "error" : "ok";
    } catch {
      supabasePing = "error";
    }
  }

  return ok({
    status: "ok",
    runtimeMode: env.runtimeMode,
    supabaseConfigured: env.isSupabaseConfigured,
    supabasePing,
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
