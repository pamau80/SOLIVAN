import { fail, ok } from "@/lib/api";
import { getDb } from "@/services/local/db";
import {
  confirmOperation,
  createException,
  createPlannedOperation,
  getOperationDetail,
  registerIncident,
  updatePassengerExecution,
} from "@/services/operations-service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (id) {
      const detail = getOperationDetail(id);
      if (!detail) return fail(new Error("Operación no encontrada"), 404);
      return ok(detail);
    }
    const db = getDb();
    return ok({
      operations: db.operations,
      shifts: db.shifts,
      vehicles: db.vehicles,
      providers: db.providers,
    });
  } catch (error) {
    return fail(error, 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    switch (body?.action) {
      case "plan":
        return ok(createPlannedOperation(body));
      case "confirm":
        return ok({ operation: confirmOperation(body.operationId) });
      case "exception":
        return ok({ exception: createException(body) });
      case "execution":
        return ok({ passenger: updatePassengerExecution(body) });
      case "incident":
        return ok({ incident: registerIncident(body) });
      default:
        throw new Error("Acción de operación no soportada");
    }
  } catch (error) {
    return fail(error);
  }
}
