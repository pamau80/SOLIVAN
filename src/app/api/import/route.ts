import { fail, ok } from "@/lib/api";
import { assertSessionCanWrite } from "@/lib/auth/assert-write";
import { requireSession } from "@/lib/auth/server-session";
import { importPostSchema } from "@/domain/schemas/operations";
import { getAppEnv } from "@/lib/env";
import {
  commitImportFacade,
  listImportsFacade,
  previewImportFacade,
} from "@/services/operations-facade";

export async function GET() {
  try {
    await requireSession();
    const data = await listImportsFacade();
    return ok({ ...data, runtimeMode: getAppEnv().runtimeMode });
  } catch (error) {
    return fail(error, 401);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = importPostSchema.parse(await request.json());
    if (body.action === "preview") {
      return ok(await previewImportFacade(body));
    }
    assertSessionCanWrite(session);
    return ok({ batch: await commitImportFacade(body) });
  } catch (error) {
    return fail(error);
  }
}
