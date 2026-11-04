import { fail, ok } from "@/lib/api";
import { getDb, resetDb } from "@/services/local/db";
import { setSessionRole } from "@/services/operations-service";

export async function GET() {
  try {
    const db = getDb();
    return ok({
      session: db.session,
      profiles: db.profiles,
      auditLog: db.auditLog.slice(0, 50),
      shifts: db.shifts,
    });
  } catch (error) {
    return fail(error, 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body?.action === "setRole") {
      return ok({ session: setSessionRole(body.role) });
    }
    if (body?.action === "resetDemo") {
      return ok({ db: resetDb(), message: "Base local reiniciada" });
    }
    throw new Error("Acción de administración no soportada");
  } catch (error) {
    return fail(error);
  }
}
