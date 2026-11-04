"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { apiFetch } from "@/lib/client-api";

type Payload = {
  exceptions: Array<{
    id: string;
    operationId: string;
    reason: string;
    authorizedAt: string;
    newVehicleId: string | null;
  }>;
  incidents: Array<{
    id: string;
    operationId: string;
    category: string;
    description: string;
    createdAt: string;
  }>;
  operations: Array<{ id: string; operationDate: string; status: string }>;
  runtimeMode: string;
};

export default function HistorialPage() {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Payload>("/api/historial")
      .then(setData)
      .catch((err: Error) => setError(err.message));
  }, []);

  if (!data && !error) {
    return <p className="text-sm text-slate-600">Cargando historial…</p>;
  }

  const opDate = new Map(
    (data?.operations ?? []).map((o) => [o.id, o.operationDate] as const),
  );

  return (
    <div>
      <PageHeader
        title="Historial"
        description={`Excepciones e incidencias registradas · modo ${data?.runtimeMode ?? "—"}`}
      />
      {error ? (
        <div className="mb-4">
          <Alert tone="error">{error}</Alert>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border bg-white p-4">
          <h3 className="text-sm font-semibold">Excepciones de asignación</h3>
          <ul className="mt-3 divide-y text-sm">
            {(data?.exceptions ?? []).map((item) => (
              <li key={item.id} className="py-2">
                <p className="font-medium">{item.reason}</p>
                <p className="text-xs text-slate-500">
                  Op {opDate.get(item.operationId) ?? item.operationId.slice(0, 8)} ·{" "}
                  {new Date(item.authorizedAt).toLocaleString("es-CL")}
                </p>
              </li>
            ))}
            {(data?.exceptions.length ?? 0) === 0 ? (
              <li className="py-2 text-slate-500">Sin excepciones.</li>
            ) : null}
          </ul>
        </section>

        <section className="rounded-lg border bg-white p-4">
          <h3 className="text-sm font-semibold">Incidencias</h3>
          <ul className="mt-3 divide-y text-sm">
            {(data?.incidents ?? []).map((item) => (
              <li key={item.id} className="py-2">
                <p className="font-medium">
                  {item.category}: {item.description}
                </p>
                <p className="text-xs text-slate-500">
                  Op {opDate.get(item.operationId) ?? item.operationId.slice(0, 8)} ·{" "}
                  {new Date(item.createdAt).toLocaleString("es-CL")}
                </p>
              </li>
            ))}
            {(data?.incidents.length ?? 0) === 0 ? (
              <li className="py-2 text-slate-500">Sin incidencias.</li>
            ) : null}
          </ul>
        </section>
      </div>
    </div>
  );
}
