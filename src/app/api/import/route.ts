import { fail, ok } from "@/lib/api";
import { requireSession } from "@/lib/auth/server-session";
import { getDb } from "@/services/local/db";
import { commitImport, previewImport } from "@/services/operations-service";

export async function GET() {
  try {
    await requireSession();
    const db = getDb();
    return ok({
      batches: db.importBatches,
      rows: db.importBatchRows.slice(0, 200),
    });
  } catch (error) {
    return fail(error, 401);
  }
}

export async function POST(request: Request) {
  try {
    await requireSession();
    const body = await request.json();
    if (body?.action === "preview") {
      return ok(previewImport(body));
    }
    if (body?.action === "commit") {
      return ok({ batch: commitImport(body) });
    }
    throw new Error("Acción de importación no soportada");
  } catch (error) {
    return fail(error);
  }
}
