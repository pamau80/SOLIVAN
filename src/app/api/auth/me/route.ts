import { fail, ok } from "@/lib/api";
import { readSession } from "@/lib/auth/server-session";
import { getAppEnv } from "@/lib/env";
import { LOCAL_DEMO_USERS } from "@/lib/auth/local-users";

export async function GET() {
  try {
    const session = await readSession();
    const env = getAppEnv();
    return ok({
      authenticated: Boolean(session),
      session,
      runtimeMode: env.runtimeMode,
      demoUsers:
        env.runtimeMode === "local"
          ? LOCAL_DEMO_USERS.map((u) => ({
              email: u.email,
              role: u.role,
              hintPassword: u.password,
            }))
          : [],
    });
  } catch (error) {
    return fail(error, 500);
  }
}
