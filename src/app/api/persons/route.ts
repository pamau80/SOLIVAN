import { fail, ok } from "@/lib/api";
import { requireSession } from "@/lib/auth/server-session";
import {
  linkPersonAddressFacade,
  listFleetFacade,
  listGeographyFacade,
  listHabitualFacade,
  listPersonsFacade,
  setHabitualFacade,
  upsertPersonFacade,
} from "@/services/catalog-facade";
import { getAppEnv } from "@/lib/env";

export async function GET() {
  try {
    await requireSession();
    const env = getAppEnv();
    const [persons, habitualAssignments, fleet, geography] = await Promise.all([
      listPersonsFacade(),
      listHabitualFacade(),
      listFleetFacade(),
      listGeographyFacade(),
    ]);

    return ok({
      persons,
      habitualAssignments,
      providers: fleet.providers,
      vehicles: fleet.vehicles,
      zones: geography.zones,
      sectors: geography.sectors,
      addresses: geography.addresses,
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
      const assignment = await setHabitualFacade(body);
      return ok({ assignment });
    }
    if (body?.action === "linkAddress") {
      const person = await linkPersonAddressFacade(
        body.personId,
        body.addressId ?? null,
      );
      return ok({ person });
    }
    const person = await upsertPersonFacade(body);
    return ok({ person });
  } catch (error) {
    return fail(error);
  }
}
