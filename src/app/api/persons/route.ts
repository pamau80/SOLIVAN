import { fail, ok } from "@/lib/api";
import {
  listPersons,
  setHabitualAssignment,
  upsertPerson,
} from "@/services/catalog-service";
import { getDb } from "@/services/local/db";

export async function GET() {
  try {
    const db = getDb();
    return ok({
      persons: listPersons(),
      habitualAssignments: db.habitualAssignments.filter((h) => h.isCurrent),
      vehicles: db.vehicles,
      providers: db.providers,
      zones: db.zones,
      sectors: db.sectors,
    });
  } catch (error) {
    return fail(error, 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body?.action === "setHabitual") {
      const assignment = setHabitualAssignment(body);
      return ok({ assignment });
    }
    const person = upsertPerson(body);
    return ok({ person });
  } catch (error) {
    return fail(error);
  }
}
