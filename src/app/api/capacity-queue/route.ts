import { fail, ok } from "@/lib/api";
import { requireSession } from "@/lib/auth/server-session";
import { buildCapacityQueue } from "@/services/capacity-queue";

export async function GET(request: Request) {
  try {
    await requireSession();
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") ?? undefined;
    return ok(await buildCapacityQueue(date));
  } catch (error) {
    return fail(error, 401);
  }
}
