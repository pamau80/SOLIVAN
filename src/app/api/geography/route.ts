import { fail, ok } from "@/lib/api";
import { assertSessionCanWrite } from "@/lib/auth/assert-write";
import { requireSession } from "@/lib/auth/server-session";
import { geographyPostSchema } from "@/domain/schemas/catalog";
import {
  listGeographyFacade,
  setEntityActiveFacade,
  upsertAddressFacade,
  upsertCommuneFacade,
  upsertSectorFacade,
  upsertZoneFacade,
} from "@/services/catalog-facade";
import { getAppEnv } from "@/lib/env";

export async function GET() {
  try {
    await requireSession();
    const data = await listGeographyFacade();
    return ok({ ...data, runtimeMode: getAppEnv().runtimeMode });
  } catch (error) {
    return fail(error, 401);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    assertSessionCanWrite(session);
    const body = geographyPostSchema.parse(await request.json());

    if ("action" in body) {
      const isActive = body.action === "reactivate";
      return ok({
        item: await setEntityActiveFacade(body.entity, body.id, isActive),
      });
    }
    if (body.entity === "zone") {
      return ok({ zone: await upsertZoneFacade(body) });
    }
    if (body.entity === "commune") {
      return ok({ commune: await upsertCommuneFacade(body) });
    }
    if (body.entity === "sector") {
      return ok({ sector: await upsertSectorFacade(body) });
    }
    return ok({ address: await upsertAddressFacade(body) });
  } catch (error) {
    return fail(error);
  }
}
