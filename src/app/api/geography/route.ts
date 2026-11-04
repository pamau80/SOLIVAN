import { fail, ok } from "@/lib/api";
import {
  listGeography,
  upsertCommune,
  upsertSector,
  upsertZone,
} from "@/services/catalog-service";

export async function GET() {
  try {
    return ok(listGeography());
  } catch (error) {
    return fail(error, 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body?.entity === "zone") return ok({ zone: upsertZone(body) });
    if (body?.entity === "commune") return ok({ commune: upsertCommune(body) });
    if (body?.entity === "sector") return ok({ sector: upsertSector(body) });
    throw new Error("Entidad geográfica no soportada");
  } catch (error) {
    return fail(error);
  }
}
