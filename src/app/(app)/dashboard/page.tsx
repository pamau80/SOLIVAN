"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Alert } from "@/components/ui/Alert";
import { apiFetch } from "@/lib/client-api";

type DashboardPayload = {
  stats: {
    persons: number;
    usesTransport: number;
    vehiclesAvailable: number;
    totalCapacity: number;
    operations: number;
    openOperations: number;
    importBatches: number;
    exceptions: number;
    incidents: number;
    auditRecent: Array<{
      id: string;
      action: string;
      entityType: string;
      createdAt: string;
    }>;
  };
  session: { role: string };
  mode: string;
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<DashboardPayload>("/api/dashboard")
      .then(setData)
      .catch((err: Error) => setError(err.message));
  }, []);

  if (error) {
    return <Alert tone="error">{error}</Alert>;
  }

  if (!data) {
    return <p className="text-sm text-slate-600">Cargando dashboard…</p>;
  }

  const { stats } = data;

  return (
    <div>
      <PageHeader
        title="Dashboard operacional"
        description="Indicadores vivos del ciclo de transporte (catálogo + operaciones)."
      />

      <div className="mb-6">
        <Alert tone={data.mode === "supabase" ? "success" : "info"}>
          Runtime <strong>{data.mode}</strong> · rol sesión{" "}
          <strong>{data.session.role}</strong>
          {data.mode === "local"
            ? " · sin variables Supabase (store local)"
            : " · lecturas/escrituras vía Postgres"}
        </Alert>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Personas activas"
          value={stats.persons}
          hint={`${stats.usesTransport} usan transporte`}
        />
        <StatCard
          label="Vehículos disponibles"
          value={stats.vehiclesAvailable}
          hint={`Capacidad ${stats.totalCapacity}`}
        />
        <StatCard
          label="Operaciones"
          value={stats.operations}
          hint={`${stats.openOperations} abiertas`}
        />
        <StatCard
          label="Excepciones / incidencias"
          value={`${stats.exceptions} / ${stats.incidents}`}
          hint={`${stats.importBatches} lotes importados`}
        />
      </div>

      <section className="mt-8 rounded-lg border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-slate-900">
          Actividad reciente
        </h3>
        {stats.auditRecent.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">Sin eventos aún.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100 text-sm">
            {stats.auditRecent.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between py-2"
              >
                <span>
                  <span className="font-medium">{entry.action}</span>{" "}
                  <span className="text-slate-500">{entry.entityType}</span>
                </span>
                <span className="text-xs text-slate-400">
                  {new Date(entry.createdAt).toLocaleString("es-CL")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
