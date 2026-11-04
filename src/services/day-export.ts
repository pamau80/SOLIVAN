import { getAppEnv } from "@/lib/env";
import { getDb } from "@/services/local/db";
import {
  buildNominaFacade,
  buildOperationalReportFacade,
  listOperationsFacade,
} from "@/services/operations-facade";
import { buildCapacityQueue } from "@/services/capacity-queue";

export async function buildDayExport(date?: string) {
  const target = date ?? new Date().toISOString().slice(0, 10);
  const [opsList, report, queue] = await Promise.all([
    listOperationsFacade(),
    buildOperationalReportFacade({ from: target, to: target }),
    buildCapacityQueue(target),
  ]);

  const dayOps = opsList.operations.filter((o) => o.operationDate === target);
  const nominas = [];
  for (const op of dayOps) {
    const nomina = await buildNominaFacade({ operationId: op.id });
    nominas.push({
      operationId: op.id,
      status: op.status,
      rows: nomina.rows,
    });
  }

  let audit: Array<{
    id: string;
    action: string;
    entityType: string;
    createdAt: string;
  }> = [];

  if (getAppEnv().runtimeMode === "local") {
    audit = getDb()
      .auditLog.filter((e) => e.createdAt.slice(0, 10) === target)
      .slice(0, 200)
      .map((e) => ({
        id: e.id,
        action: e.action,
        entityType: e.entityType,
        createdAt: e.createdAt,
      }));
  } else {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const from = `${target}T00:00:00.000Z`;
    const to = `${target}T23:59:59.999Z`;
    const { data, error } = await supabase
      .from("audit_log")
      .select("id, action, entity_type, created_at")
      .gte("created_at", from)
      .lte("created_at", to)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    audit = (data ?? []).map((row) => ({
      id: String(row.id),
      action: String(row.action),
      entityType: String(row.entity_type),
      createdAt: String(row.created_at),
    }));
  }

  return {
    date: target,
    runtimeMode: getAppEnv().runtimeMode,
    report,
    capacityQueue: queue,
    nominas,
    audit,
    generatedAt: new Date().toISOString(),
  };
}
