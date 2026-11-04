import * as XLSX from "xlsx";
import { fail, ok } from "@/lib/api";
import { requireSession } from "@/lib/auth/server-session";
import { buildNominaFacade } from "@/services/operations-facade";

export async function GET(request: Request) {
  try {
    await requireSession();
    const { searchParams } = new URL(request.url);
    const operationId = searchParams.get("operationId");
    if (!operationId) throw new Error("operationId requerido");
    const format = searchParams.get("format") ?? "json";
    const providerId = searchParams.get("providerId") ?? undefined;
    const vehicleId = searchParams.get("vehicleId") ?? undefined;

    const nomina = await buildNominaFacade({
      operationId,
      providerId,
      vehicleId,
    });

    if (format === "xlsx") {
      const sheet = XLSX.utils.json_to_sheet(nomina.rows);
      const book = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(book, sheet, "Nomina");
      const buffer = XLSX.write(book, { type: "buffer", bookType: "xlsx" });
      return new Response(buffer, {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="nomina-${operationId.slice(0, 8)}.xlsx"`,
        },
      });
    }

    if (format === "csv") {
      const sheet = XLSX.utils.json_to_sheet(nomina.rows);
      const csv = XLSX.utils.sheet_to_csv(sheet);
      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="nomina-${operationId.slice(0, 8)}.csv"`,
        },
      });
    }

    return ok(nomina);
  } catch (error) {
    return fail(error);
  }
}
