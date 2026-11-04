import { fail, ok } from "@/lib/api";
import { assertSessionCanWrite } from "@/lib/auth/assert-write";
import { requireSession } from "@/lib/auth/server-session";
import { fleetPostSchema } from "@/domain/schemas/catalog";
import {
  listFleetFacade,
  setEntityActiveFacade,
  upsertProviderFacade,
  upsertVehicleFacade,
} from "@/services/catalog-facade";
import { getAppEnv } from "@/lib/env";

export async function GET() {
  try {
    await requireSession();
    const data = await listFleetFacade();
    return ok({ ...data, runtimeMode: getAppEnv().runtimeMode });
  } catch (error) {
    return fail(error, 401);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    assertSessionCanWrite(session);
    const body = fleetPostSchema.parse(await request.json());

    if ("action" in body) {
      const isActive = body.action === "reactivate";
      return ok({
        item: await setEntityActiveFacade(body.entity, body.id, isActive),
      });
    }
    if (body.entity === "provider") {
      return ok({ provider: await upsertProviderFacade(body) });
    }
    return ok({ vehicle: await upsertVehicleFacade(body) });
  } catch (error) {
    return fail(error);
  }
}
