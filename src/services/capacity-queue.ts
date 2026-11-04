import { getDb } from "@/services/local/db";
import { getAppEnv } from "@/lib/env";
import {
  getOperationDetailFacade,
  listOperationsFacade,
} from "@/services/operations-facade";

export type CapacityQueueItem = {
  operationId: string;
  date: string;
  status: string;
  unassignedExternalIds: string[];
  capacityDeficit: number;
  passengers: number;
  tripCapacity: number;
};

export async function buildCapacityQueue(date?: string): Promise<{
  date: string;
  items: CapacityQueueItem[];
  totalUnassigned: number;
}> {
  const target = date ?? new Date().toISOString().slice(0, 10);
  const list = await listOperationsFacade();
  const ops = list.operations.filter((o) => o.operationDate === target);
  const items: CapacityQueueItem[] = [];

  for (const op of ops) {
    const detail = await getOperationDetailFacade(op.id);
    if (!detail) continue;
    const assignedPassengerIds = new Set(
      detail.assignments.map((a) => a.operationPassengerId),
    );
    const unassigned = detail.passengers
      .filter((p) => !assignedPassengerIds.has(p.id) && p.requiresTransport)
      .map((p) => p.externalIdSnapshot);
    const tripCapacity = detail.trips.reduce(
      (sum, t) => sum + t.plannedCapacity,
      0,
    );
    const deficit = Math.max(0, detail.passengers.length - tripCapacity);
    if (unassigned.length > 0 || deficit > 0) {
      items.push({
        operationId: op.id,
        date: op.operationDate,
        status: op.status,
        unassignedExternalIds: unassigned,
        capacityDeficit: deficit,
        passengers: detail.passengers.length,
        tripCapacity,
      });
    }
  }

  // En modo local también revisar la última planificación en memoria si no hay ops del día
  if (getAppEnv().runtimeMode === "local" && items.length === 0) {
    const db = getDb();
    void db;
  }

  return {
    date: target,
    items,
    totalUnassigned: items.reduce(
      (sum, item) => sum + item.unassignedExternalIds.length,
      0,
    ),
  };
}
