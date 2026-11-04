import { fail, ok } from "@/lib/api";
import { requireSession } from "@/lib/auth/server-session";
import { dayExportSchema } from "@/domain/schemas/operations";
import { buildDayExport } from "@/services/day-export";

export async function GET(request: Request) {
  try {
    await requireSession();
    const { searchParams } = new URL(request.url);
    const parsed = dayExportSchema.parse({
      date: searchParams.get("date") ?? undefined,
    });
    const format = searchParams.get("format") ?? "json";
    const payload = await buildDayExport(parsed.date);

    if (format === "json-download") {
      return new Response(JSON.stringify(payload, null, 2), {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition": `attachment; filename="solivan-dia-${payload.date}.json"`,
        },
      });
    }

    return ok(payload);
  } catch (error) {
    return fail(error);
  }
}
