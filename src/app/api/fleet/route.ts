import { fail, ok } from "@/lib/api";
import { requireSession } from "@/lib/auth/server-session";
import {
  listFleetFacade,
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
    await requireSession();
    const body = await request.json();
    if (body?.entity === "provider") {
      return ok({ provider: await upsertProviderFacade(body) });
    }
    if (body?.entity === "vehicle") {
      return ok({ vehicle: await upsertVehicleFacade(body) });
    }
    throw new Error("Entidad de flota no soportada");
  } catch (error) {
    return fail(error);
  }
}
