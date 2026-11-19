import { fail, ok } from "@/lib/api";
import { readSession } from "@/lib/auth/server-session";
import {
  isLocalAuthConfigured,
  listExposedLocalUsers,
  usesSampleLocalUsers,
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
      usingSampleUsers:
        env.runtimeMode === "local" ? usesSampleLocalUsers() : false,
      demoUsers:
        env.runtimeMode === "local" ? listExposedLocalUsers() : [],
    });
  } catch (error) {
    return fail(error, 500);
  }
}
