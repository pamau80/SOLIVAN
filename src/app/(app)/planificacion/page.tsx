"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { StatCard } from "@/components/ui/StatCard";
import { apiFetch } from "@/lib/client-api";

type ListPayload = {
  operations: Array<{
    id: string;
    operationDate: string;
    shiftId: string;
    status: string;
  }>;
  shifts: Array<{ id: string; code: string; name: string }>;
  vehicles: Array<{ id: string; plate: string; authorizedCapacity: number }>;
};

type PlanResult = {
  operation: { id: string; operationDate: string; status: string };
  plan: {
    warnings: string[];
    unassignedExternalIds: string[];
    capacity: {
      passengersScheduled: number;
      totalAvailableCapacity: number;
      occupiedCapacity: number;
      occupancyPercent: number;
      capacityDeficit: number;
      vehiclesRequiredTheoreticalMin: number;
    };
    trips: Array<{
      vehicleId: string;
      plannedCapacity: number;
      passengerExternalIds: string[];
      sequenceNumber: number;
    }>;
  };
};

export default function PlanificacionPage() {
  const [list, setList] = useState<ListPayload | null>(null);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [shiftCode, setShiftCode] = useState("A");
  const [result, setResult] = useState<PlanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    setList(await apiFetch<ListPayload>("/api/operations"));
  }

  useEffect(() => {
    load().catch((err: Error) => setError(err.message));
  }, []);

  async function plan() {
    setError(null);
    setMessage(null);
    try {
      const data = await apiFetch<PlanResult>("/api/operations", {
        method: "POST",
        body: JSON.stringify({ action: "plan", date, shiftCode }),
      });
      setResult(data);
      setMessage(`Operación planificada: ${data.operation.id.slice(0, 8)}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  async function confirm() {
    if (!result) return;
    try {
      await apiFetch("/api/operations", {
        method: "POST",
        body: JSON.stringify({
          action: "confirm",
          operationId: result.operation.id,
        }),
      });
      setMessage("Planificación confirmada");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  const vehiclePlate = (id: string) =>
    list?.vehicles.find((v) => v.id === id)?.plate ?? id.slice(0, 8);

  return (
    <div>
      <PageHeader
        title="Planificación"
        description="Motor F/G: identifica, agrupa por habitual/zona y valida capacidad sin alterar asignaciones habituales."
      />
      {error ? <div className="mb-4"><Alert tone="error">{error}</Alert></div> : null}
      {message ? <div className="mb-4"><Alert tone="success">{message}</Alert></div> : null}

      <div className="mb-6 flex flex-wrap items-end gap-3 rounded-lg border bg-white p-4">
        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Fecha</span>
          <input
            type="date"
            className="rounded-md border px-3 py-2"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Turno</span>
          <select
            className="rounded-md border px-3 py-2"
            value={shiftCode}
            onChange={(e) => setShiftCode(e.target.value)}
          >
            {(list?.shifts ?? []).map((s) => (
              <option key={s.id} value={s.code}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <Button type="button" onClick={() => void plan()}>
          Generar planificación
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={!result}
          onClick={() => void confirm()}
        >
          Confirmar
        </Button>
      </div>

      {result ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Pasajeros" value={result.plan.capacity.passengersScheduled} />
            <StatCard label="Capacidad total" value={result.plan.capacity.totalAvailableCapacity} />
            <StatCard label="Ocupación" value={`${result.plan.capacity.occupancyPercent}%`} />
            <StatCard
              label="Déficit / pendientes"
              value={`${result.plan.capacity.capacityDeficit} / ${result.plan.unassignedExternalIds.length}`}
              hint={`Mín. teórico vehículos: ${result.plan.capacity.vehiclesRequiredTheoreticalMin}`}
            />
          </div>

          {result.plan.capacity.capacityDeficit > 0 ||
          result.plan.unassignedExternalIds.length > 0 ? (
            <div className="mt-4">
              <Alert tone="error">
                Cupo insuficiente o pasajeros sin viaje: déficit{" "}
                {result.plan.capacity.capacityDeficit}, sin asignar{" "}
                {result.plan.unassignedExternalIds.length}
                {result.plan.unassignedExternalIds.length
                  ? ` (${result.plan.unassignedExternalIds.join(", ")})`
                  : ""}
                . Ajusta flota o reduce la nómina antes de confirmar.
              </Alert>
            </div>
          ) : (
            <div className="mt-4">
              <Alert tone="success">
                Capacidad cubierta: todos los elegibles tienen asiento planificado.
              </Alert>
            </div>
          )}

          {result.plan.warnings.length ? (
            <div className="mt-4 space-y-2">
              {result.plan.warnings.map((warning) => (
                <Alert key={warning} tone="warning">
                  {warning}
                </Alert>
              ))}
            </div>
          ) : null}

          <section className="mt-6 overflow-hidden rounded-lg border bg-white">
            <div className="border-b px-4 py-3 text-sm font-semibold">Viajes</div>
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">Vehículo</th>
                  <th className="px-4 py-3 text-left">Secuencia</th>
                  <th className="px-4 py-3 text-left">Cupo</th>
                  <th className="px-4 py-3 text-left">Pasajeros</th>
                </tr>
              </thead>
              <tbody>
                {result.plan.trips.map((trip) => (
                  <tr key={`${trip.vehicleId}-${trip.sequenceNumber}`} className="border-t">
                    <td className="px-4 py-3">{vehiclePlate(trip.vehicleId)}</td>
                    <td className="px-4 py-3">{trip.sequenceNumber}</td>
                    <td className="px-4 py-3">
                      {trip.passengerExternalIds.length}/{trip.plannedCapacity}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {trip.passengerExternalIds.join(", ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      ) : null}

      <section className="mt-6 rounded-lg border bg-white p-4">
        <h3 className="text-sm font-semibold">Operaciones</h3>
        <ul className="mt-2 space-y-1 text-sm">
          {(list?.operations ?? []).map((op) => (
            <li key={op.id}>
              {op.operationDate} · {op.status} · {op.id.slice(0, 8)}
            </li>
          ))}
          {(list?.operations.length ?? 0) === 0 ? (
            <li className="text-slate-500">Sin operaciones.</li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
