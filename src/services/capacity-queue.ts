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
    const requiring = detail.passengers.filter((p) => p.requiresTransport);
    const unassigned = requiring
      .filter((p) => !assignedPassengerIds.has(p.id))
      .map((p) => p.externalIdSnapshot);
    const tripCapacity = detail.trips.reduce(
      (sum, t) => sum + t.plannedCapacity,
      0,
    );
    // Déficit operativo: demanda de transporte vs cupo planificado de viajes.
    const capacityDeficit = Math.max(0, requiring.length - tripCapacity);

    if (unassigned.length > 0 || capacityDeficit > 0) {
      items.push({
        operationId: op.id,
        date: op.operationDate,
        status: op.status,
        unassignedExternalIds: unassigned,
        capacityDeficit,
        passengers: requiring.length,
        tripCapacity,
      });
    }
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
