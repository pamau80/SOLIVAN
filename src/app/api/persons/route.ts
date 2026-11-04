import { fail, ok } from "@/lib/api";
import { requireSession } from "@/lib/auth/server-session";
import {
  linkPersonAddress,
  setHabitualAssignment,
  upsertPerson,
} from "@/services/catalog-service";
import {
  listFleetFacade,
  listHabitualFacade,
  listPersonsFacade,
  listZonesFacade,
} from "@/services/catalog-facade";
import { getDb } from "@/services/local/db";
import { getAppEnv } from "@/lib/env";

export async function GET() {
  try {
    await requireSession();
    const env = getAppEnv();
    const [persons, habitualAssignments, fleet, zones] = await Promise.all([
      listPersonsFacade(),
      listHabitualFacade(),
      listFleetFacade(),
      listZonesFacade(),
    ]);

    const localExtras =
      env.runtimeMode === "local"
        ? {
            providers: fleet.providers,
            vehicles: fleet.vehicles,
            zones,
            sectors: getDb().sectors,
            addresses: getDb().addresses,
          }
        : {
            providers: fleet.providers,
            vehicles: fleet.vehicles,
            zones,
            sectors: [],
            addresses: [],
          };

    return ok({
      persons,
      habitualAssignments,
      ...localExtras,
      runtimeMode: env.runtimeMode,
    });
  } catch (error) {
    return fail(error, 401);
  }
}

export async function POST(request: Request) {
  try {
    await requireSession();
    const body = await request.json();
    if (body?.action === "setHabitual") {
      const assignment = setHabitualAssignment(body);
      return ok({ assignment });
    }
    if (body?.action === "linkAddress") {
      const person = linkPersonAddress(body.personId, body.addressId ?? null);
      return ok({ person });
    }
    const person = upsertPerson(body);
    return ok({ person });
  } catch (error) {
    return fail(error);
  }
}
