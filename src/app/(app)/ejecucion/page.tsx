"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { apiFetch } from "@/lib/client-api";

type Ops = {
  operations: Array<{ id: string; operationDate: string; status: string }>;
  vehicles: Array<{ id: string; plate: string }>;
};

type Detail = {
  operation: { id: string; operationDate: string; status: string };
  passengers: Array<{
    id: string;
    externalIdSnapshot: string;
    fullNameSnapshot: string;
    executionStatus: string;
    habitualVehicleId: string | null;
  }>;
  exceptions: Array<{ id: string; reason: string; authorizedAt: string }>;
  incidents: Array<{ id: string; category: string; description: string }>;
};

const STATUSES = [
  "programmed",
  "assigned",
  "transported",
  "absent",
  "cancelled",
  "reassigned",
] as const;

export default function EjecucionPage() {
  const [ops, setOps] = useState<Ops | null>(null);
  const [operationId, setOperationId] = useState("");
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [exceptionForm, setExceptionForm] = useState({
    operationPassengerId: "",
    newVehicleId: "",
    reason: "",
  });
  const [incidentText, setIncidentText] = useState("");

  async function loadOps() {
    const data = await apiFetch<Ops>("/api/operations");
    setOps(data);
    if (!operationId && data.operations[0]) {
      setOperationId(data.operations[0].id);
    }
  }

  async function loadDetail(id: string) {
    if (!id) return;
    setDetail(await apiFetch<Detail>(`/api/operations?id=${id}`));
  }

  useEffect(() => {
    void loadOps().catch((err: Error) => setError(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- carga inicial única
  }, []);

  useEffect(() => {
    if (operationId) {
      void loadDetail(operationId).catch((err: Error) => setError(err.message));
    }
  }, [operationId]);

  async function setStatus(operationPassengerId: string, status: string) {
    setError(null);
    try {
      await apiFetch("/api/operations", {
        method: "POST",
        body: JSON.stringify({
          action: "execution",
          operationPassengerId,
          status,
        }),
      });
      setMessage("Estado de ejecución actualizado");
      await loadDetail(operationId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  async function saveException() {
    setError(null);
    try {
      await apiFetch("/api/operations", {
        method: "POST",
        body: JSON.stringify({
          action: "exception",
          operationId,
          ...exceptionForm,
        }),
      });
      setMessage("Excepción registrada con trazabilidad");
      setExceptionForm({ operationPassengerId: "", newVehicleId: "", reason: "" });
      await loadDetail(operationId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  async function saveIncident() {
    setError(null);
    try {
      await apiFetch("/api/operations", {
        method: "POST",
        body: JSON.stringify({
          action: "incident",
          operationId,
          category: "operacional",
          description: incidentText,
        }),
      });
      setIncidentText("");
      setMessage("Incidencia registrada");
      await loadDetail(operationId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  return (
    <div>
      <PageHeader
        title="Control de ejecución"
        description="Diferencia programados, asignados, transportados, ausentes y reasignaciones con historial."
      />
      {error ? <div className="mb-4"><Alert tone="error">{error}</Alert></div> : null}
      {message ? <div className="mb-4"><Alert tone="success">{message}</Alert></div> : null}

      <div className="mb-4 rounded-lg border bg-white p-4">
        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Operación</span>
          <select
            className="rounded-md border px-3 py-2"
            value={operationId}
            onChange={(e) => setOperationId(e.target.value)}
          >
            {(ops?.operations ?? []).map((op) => (
              <option key={op.id} value={op.id}>
                {op.operationDate} · {op.status} · {op.id.slice(0, 8)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {detail ? (
        <>
          <div className="overflow-hidden rounded-lg border bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2 text-left">ID</th>
                  <th className="px-3 py-2 text-left">Nombre</th>
                  <th className="px-3 py-2 text-left">Estado</th>
                  <th className="px-3 py-2 text-left">Cambiar</th>
                </tr>
              </thead>
              <tbody>
                {detail.passengers.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="px-3 py-2 font-mono text-xs">{p.externalIdSnapshot}</td>
                    <td className="px-3 py-2">{p.fullNameSnapshot}</td>
                    <td className="px-3 py-2">{p.executionStatus}</td>
                    <td className="px-3 py-2">
                      <select
                        className="rounded-md border px-2 py-1 text-xs"
                        value={p.executionStatus}
                        onChange={(e) => void setStatus(p.id, e.target.value)}
                      >
                        {STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <section className="space-y-2 rounded-lg border bg-white p-4">
              <h3 className="text-sm font-semibold">Excepción autorizada</h3>
              <select
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={exceptionForm.operationPassengerId}
                onChange={(e) =>
                  setExceptionForm({
                    ...exceptionForm,
                    operationPassengerId: e.target.value,
                  })
                }
              >
                <option value="">Pasajero…</option>
                {detail.passengers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullNameSnapshot}
                  </option>
                ))}
              </select>
              <select
                className="w-full rounded-md border px-3 py-2 text-sm"
                value={exceptionForm.newVehicleId}
                onChange={(e) =>
                  setExceptionForm({
                    ...exceptionForm,
                    newVehicleId: e.target.value,
                  })
                }
              >
                <option value="">Vehículo destino…</option>
                {(ops?.vehicles ?? []).map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.plate}
                  </option>
                ))}
              </select>
              <input
                className="w-full rounded-md border px-3 py-2 text-sm"
                placeholder="Motivo (obligatorio)"
                value={exceptionForm.reason}
                onChange={(e) =>
                  setExceptionForm({ ...exceptionForm, reason: e.target.value })
                }
              />
              <Button type="button" onClick={() => void saveException()}>
                Registrar excepción
              </Button>
              <ul className="text-xs text-slate-600">
                {detail.exceptions.map((ex) => (
                  <li key={ex.id}>
                    {ex.reason} · {new Date(ex.authorizedAt).toLocaleString("es-CL")}
                  </li>
                ))}
              </ul>
            </section>

            <section className="space-y-2 rounded-lg border bg-white p-4">
              <h3 className="text-sm font-semibold">Incidencia</h3>
              <textarea
                className="min-h-24 w-full rounded-md border px-3 py-2 text-sm"
                value={incidentText}
                onChange={(e) => setIncidentText(e.target.value)}
                placeholder="Descripción"
              />
              <Button type="button" onClick={() => void saveIncident()}>
                Registrar incidencia
              </Button>
              <ul className="text-xs text-slate-600">
                {detail.incidents.map((inc) => (
                  <li key={inc.id}>
                    [{inc.category}] {inc.description}
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </>
      ) : (
        <Alert tone="info">No hay operación seleccionada. Planifica primero.</Alert>
      )}
    </div>
  );
}
