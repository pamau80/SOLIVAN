import { fail, ok } from "@/lib/api";
import { requireSession } from "@/lib/auth/server-session";
import {
  listGeography,
  upsertAddress,
  upsertCommune,
  upsertSector,
  upsertZone,
} from "@/services/catalog-service";

export async function GET() {
  try {
    await requireSession();
    return ok(listGeography());
  } catch (error) {
    return fail(error, 401);
  }
}

export async function POST(request: Request) {
  try {
    await requireSession();
    const body = await request.json();
    if (body?.entity === "zone") return ok({ zone: upsertZone(body) });
    if (body?.entity === "commune") return ok({ commune: upsertCommune(body) });
    if (body?.entity === "sector") return ok({ sector: upsertSector(body) });
    if (body?.entity === "address") return ok({ address: upsertAddress(body) });
    throw new Error("Entidad geográfica no soportada");
  } catch (error) {
    return fail(error);
  }
}
