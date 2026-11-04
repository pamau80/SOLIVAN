import { fail, ok } from "@/lib/api";
import { requireSession } from "@/lib/auth/server-session";
import { getAppEnv } from "@/lib/env";
import { getDashboardStats } from "@/services/catalog-service";
import { getDb } from "@/services/local/db";

export async function GET() {
  try {
    const session = await requireSession();
    const env = getAppEnv();
    return ok({
      stats: getDashboardStats(),
      session: {
        userId: session.userId,
        role: session.role,
        email: session.email,
        fullName: session.fullName,
      },
      shifts: getDb().shifts,
      mode: env.runtimeMode,
    });
  } catch (error) {
    return fail(error, 401);
  }
}
