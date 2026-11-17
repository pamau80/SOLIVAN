import { fail, ok } from "@/lib/api";
import { assertPermission } from "@/lib/auth/assert-write";
import { requireSession } from "@/lib/auth/server-session";
import { personsPostSchema } from "@/domain/schemas/catalog";
import {
  deactivatePersonFacade,
  linkPersonAddressFacade,
  listFleetFacade,
  listGeographyFacade,
  listHabitualFacade,
  listInactivePersonsFacade,
  listPersonsFacade,
  reactivatePersonFacade,
  setHabitualFacade,
  upsertPersonFacade,
} from "@/services/catalog-facade";
import { getAppEnv } from "@/lib/env";

export async function GET(request: Request) {
  try {
    await requireSession();
    const env = getAppEnv();
    const { searchParams } = new URL(request.url);
    if (searchParams.get("inactive") === "1") {
      return ok({
        persons: await listInactivePersonsFacade(),
        runtimeMode: env.runtimeMode,
      });
    }

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
    const session = await requireSession();
    const body = personsPostSchema.parse(await request.json());

    if ("action" in body && body.action === "setHabitual") {
      assertPermission(session, "habitual.write");
      return ok({ assignment: await setHabitualFacade(body) });
    }
    if ("action" in body && body.action === "linkAddress") {
      assertPermission(session, "persons.write");
      return ok({
        person: await linkPersonAddressFacade(
          body.personId,
          body.addressId ?? null,
        ),
      });
    }
    if ("action" in body && body.action === "deactivate") {
      assertPermission(session, "persons.write");
      return ok({ person: await deactivatePersonFacade(body.personId) });
    }
    if ("action" in body && body.action === "reactivate") {
      assertPermission(session, "persons.write");
      return ok({ person: await reactivatePersonFacade(body.personId) });
    }

    assertPermission(session, "persons.write");
    return ok({ person: await upsertPersonFacade(body) });
  } catch (error) {
    return fail(error);
  }
}
