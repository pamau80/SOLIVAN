import { fail, ok } from "@/lib/api";
import { requireSession } from "@/lib/auth/server-session";
import { getAppEnv } from "@/lib/env";
import { getDb } from "@/services/local/db";
import { listOperationsFacade } from "@/services/operations-facade";
import { createClient } from "@/lib/supabase/server";
import {
  mapException,
  mapIncident,
} from "@/services/repository/ops-mappers";

export async function GET() {
  try {
    await requireSession();
    const env = getAppEnv();

    if (env.runtimeMode === "supabase") {
      const supabase = await createClient();
      const [exceptions, incidents, ops] = await Promise.all([
        supabase
          .from("assignment_exceptions")
          .select("*")
          .order("authorized_at", { ascending: false })
          .limit(100),
        supabase
          .from("incidents")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100),
        listOperationsFacade(),
      ]);
      if (exceptions.error) throw new Error(exceptions.error.message);
      if (incidents.error) throw new Error(incidents.error.message);
      return ok({
        exceptions: (exceptions.data ?? []).map((row) =>
          mapException(row as Record<string, unknown>),
        ),
        incidents: (incidents.data ?? []).map((row) =>
          mapIncident(row as Record<string, unknown>),
        ),
        operations: ops.operations,
        runtimeMode: env.runtimeMode,
      });
    }

    const db = getDb();
    return ok({
      exceptions: db.exceptions.slice(0, 100),
      incidents: db.incidents.slice(0, 100),
      operations: db.operations,
      runtimeMode: env.runtimeMode,
    });
  } catch (error) {
    return fail(error, 401);
  }
}
