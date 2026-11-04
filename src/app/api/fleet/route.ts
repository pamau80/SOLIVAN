import { fail, ok } from "@/lib/api";
import {
  listFleet,
  upsertProvider,
  upsertVehicle,
} from "@/services/catalog-service";

export async function GET() {
  try {
    return ok(listFleet());
  } catch (error) {
    return fail(error, 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body?.entity === "provider") {
      return ok({ provider: upsertProvider(body) });
    }
    if (body?.entity === "vehicle") {
      return ok({ vehicle: upsertVehicle(body) });
    }
    throw new Error("Entidad de flota no soportada");
  } catch (error) {
    return fail(error);
  }
}
