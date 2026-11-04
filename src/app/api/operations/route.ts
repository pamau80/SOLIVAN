import { fail, ok } from "@/lib/api";
import { assertSessionCanWrite } from "@/lib/auth/assert-write";
import { requireSession } from "@/lib/auth/server-session";
import { operationsPostSchema } from "@/domain/schemas/operations";
import { getAppEnv } from "@/lib/env";
import {
  confirmOperationFacade,
  createExceptionFacade,
  getOperationDetailFacade,
  listOperationsFacade,
  planOperationFacade,
  registerIncidentFacade,
  updatePassengerExecutionFacade,
} from "@/services/operations-facade";

export async function GET(request: Request) {
  try {
    await requireSession();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (id) {
      const detail = await getOperationDetailFacade(id);
      if (!detail) return fail(new Error("Operación no encontrada"), 404);
      return ok({ ...detail, runtimeMode: getAppEnv().runtimeMode });
    }
    const list = await listOperationsFacade();
    return ok({ ...list, runtimeMode: getAppEnv().runtimeMode });
  } catch (error) {
    return fail(error, 401);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    assertSessionCanWrite(session);
    const body = operationsPostSchema.parse(await request.json());
    switch (body.action) {
      case "plan":
        return ok(await planOperationFacade(body));
      case "confirm":
        return ok({
          operation: await confirmOperationFacade(body.operationId),
        });
      case "exception":
        return ok({ exception: await createExceptionFacade(body) });
      case "execution":
        return ok({
          passenger: await updatePassengerExecutionFacade(body),
        });
      case "incident":
        return ok({ incident: await registerIncidentFacade(body) });
      default:
        throw new Error("Acción de operación no soportada");
    }
  } catch (error) {
    return fail(error);
  }
}
