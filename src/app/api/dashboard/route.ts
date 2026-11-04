import { fail, ok } from "@/lib/api";
import { getDashboardStats } from "@/services/catalog-service";
import { getDb } from "@/services/local/db";

export async function GET() {
  try {
    return ok({
      stats: getDashboardStats(),
      session: getDb().session,
      shifts: getDb().shifts,
      mode: "local",
    });
  } catch (error) {
    return fail(error, 500);
  }
}
