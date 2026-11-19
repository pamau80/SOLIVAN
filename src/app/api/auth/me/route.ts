import { fail, ok } from "@/lib/api";
import { readSession } from "@/lib/auth/server-session";
import {
  isLocalAuthConfigured,
  listExposedLocalUsers,
} from "@/lib/auth/local-users";
import { getAppEnv } from "@/lib/env";

export async function GET() {
  try {
    const session = await readSession();
    const env = getAppEnv();

    return ok({
      authenticated: Boolean(session),
      session,
      runtimeMode: env.runtimeMode,
      localAuthConfigured:
        env.runtimeMode === "local" ? isLocalAuthConfigured() : true,
      // Nunca incluye passwords. Solo emails/roles con opt-in fuera de producción.
      demoUsers:
        env.runtimeMode === "local" ? listExposedLocalUsers() : [],
    });
  } catch (error) {
    return fail(error, 500);
  }
}
