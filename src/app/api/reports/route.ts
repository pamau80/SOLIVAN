import { fail, ok } from "@/lib/api";
import { requireSession } from "@/lib/auth/server-session";
import { buildOperationalReport } from "@/services/reports-service";

export async function GET(request: Request) {
  try {
    await requireSession();
    const { searchParams } = new URL(request.url);
    const report = buildOperationalReport({
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
      shiftCode: searchParams.get("shiftCode") ?? undefined,
    });
    return ok(report);
  } catch (error) {
    return fail(error, 401);
  }
}
