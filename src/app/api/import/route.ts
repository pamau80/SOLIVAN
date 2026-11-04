import { fail, ok } from "@/lib/api";
import { getDb } from "@/services/local/db";
import { commitImport, previewImport } from "@/services/operations-service";

export async function GET() {
  try {
    const db = getDb();
    return ok({
      batches: db.importBatches,
      rows: db.importBatchRows.slice(0, 200),
    });
  } catch (error) {
    return fail(error, 500);
  }
}

export async function POST(request: Request) {
  try {
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
