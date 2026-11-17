import { ok } from "@/lib/api";
import { getAppEnv } from "@/lib/env";

export async function GET() {
  const env = getAppEnv();

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

  // Público: mínimo. Sin conteos ni rol de sesión.
  return ok({
    status: "ok",
    runtimeMode: env.runtimeMode,
    supabaseConfigured: env.isSupabaseConfigured,
    supabasePing,
    time: new Date().toISOString(),
  });
}
