import { fail, ok } from "@/lib/api";
import { requireSession } from "@/lib/auth/server-session";
import { getAppEnv } from "@/lib/env";
import {
  getDashboardStatsFacade,
  listShiftsFacade,
} from "@/services/operations-facade";

export async function GET() {
  try {
    const session = await requireSession();
    const env = getAppEnv();
    const [stats, shifts] = await Promise.all([
      getDashboardStatsFacade(),
      listShiftsFacade(),
    ]);
    return ok({
      stats,
      session: {
        userId: session.userId,
        role: session.role,
        email: session.email,
        fullName: session.fullName,
      },
      shifts,
      mode: env.runtimeMode,
    });
  } catch (error) {
    return fail(error, 401);
  }
}
