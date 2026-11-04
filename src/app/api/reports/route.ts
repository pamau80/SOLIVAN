import { fail, ok } from "@/lib/api";
import { requireSession } from "@/lib/auth/server-session";
import { getAppEnv } from "@/lib/env";
import { buildOperationalReportFacade } from "@/services/operations-facade";

export async function GET(request: Request) {
  try {
    await requireSession();
    const { searchParams } = new URL(request.url);
    const report = await buildOperationalReportFacade({
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
      shiftCode: searchParams.get("shiftCode") ?? undefined,
    });
    return ok({ ...report, runtimeMode: getAppEnv().runtimeMode });
  } catch (error) {
    return fail(error, 401);
  }
}
