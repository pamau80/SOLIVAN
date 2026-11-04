"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { StatCard } from "@/components/ui/StatCard";
import { apiFetch } from "@/lib/client-api";

type Report = {
  rows: Array<{
    operationId: string;
    date: string;
    shiftCode: string;
    status: string;
    passengers: number;
    assigned: number;
    transported: number;
    absent: number;
    unassigned: number;
    trips: number;
    exceptions: number;
    incidents: number;
    occupancyPercent: number;
  }>;
  totals: {
    operations: number;
    passengers: number;
    transported: number;
    absent: number;
    exceptions: number;
    incidents: number;
    avgOccupancyPercent: number;
  };
};

export default function ReportesPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [shiftCode, setShiftCode] = useState("");
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (shiftCode) params.set("shiftCode", shiftCode);
    const qs = params.toString();
    setReport(
      await apiFetch<Report>(`/api/reports${qs ? `?${qs}` : ""}`),
    );
  }

  useEffect(() => {
    void load().catch((err: Error) => setError(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- carga inicial
  }, []);

  return (
    <div>
      <PageHeader
        title="Reportes operacionales"
        description="Historial de operaciones con ocupación, ejecución e incidencias. Misma fuente que el motor de planificación."
      />
      {error ? (
        <div className="mb-4">
          <Alert tone="error">{error}</Alert>
        </div>
      ) : null}

      <div className="mb-6 flex flex-wrap items-end gap-3 rounded-lg border bg-white p-4">
        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Desde</span>
          <input
            type="date"
            className="rounded-md border px-3 py-2"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Hasta</span>
          <input
            type="date"
            className="rounded-md border px-3 py-2"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-600">Turno</span>
          <select
            className="rounded-md border px-3 py-2"
            value={shiftCode}
            onChange={(e) => setShiftCode(e.target.value)}
          >
            <option value="">Todos</option>
            <option value="A">A</option>
            <option value="B">B</option>
          </select>
        </label>
        <Button type="button" onClick={() => void load()}>
          Actualizar
        </Button>
      </div>

      {report ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Operaciones" value={report.totals.operations} />
            <StatCard label="Pasajeros" value={report.totals.passengers} />
            <StatCard
              label="Transportados / ausentes"
              value={`${report.totals.transported} / ${report.totals.absent}`}
            />
            <StatCard
              label="Ocupación promedio"
              value={`${report.totals.avgOccupancyPercent}%`}
              hint={`Excepciones ${report.totals.exceptions} · incidencias ${report.totals.incidents}`}
            />
          </div>

          <div className="mt-6 overflow-hidden rounded-lg border bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Fecha</th>
                  <th className="px-3 py-2">Turno</th>
                  <th className="px-3 py-2">Estado</th>
                  <th className="px-3 py-2">Pax</th>
                  <th className="px-3 py-2">Asig.</th>
                  <th className="px-3 py-2">Transp.</th>
                  <th className="px-3 py-2">Aus.</th>
                  <th className="px-3 py-2">Viajes</th>
                  <th className="px-3 py-2">Ocup.</th>
                  <th className="px-3 py-2">Exc/Inc</th>
                </tr>
              </thead>
              <tbody>
                {report.rows.map((row) => (
                  <tr key={row.operationId} className="border-t">
                    <td className="px-3 py-2">{row.date}</td>
                    <td className="px-3 py-2">{row.shiftCode}</td>
                    <td className="px-3 py-2">{row.status}</td>
                    <td className="px-3 py-2 tabular-nums">{row.passengers}</td>
                    <td className="px-3 py-2 tabular-nums">{row.assigned}</td>
                    <td className="px-3 py-2 tabular-nums">{row.transported}</td>
                    <td className="px-3 py-2 tabular-nums">{row.absent}</td>
                    <td className="px-3 py-2 tabular-nums">{row.trips}</td>
                    <td className="px-3 py-2 tabular-nums">
                      {row.occupancyPercent}%
                    </td>
                    <td className="px-3 py-2 tabular-nums">
                      {row.exceptions}/{row.incidents}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {report.rows.length === 0 ? (
              <p className="p-4 text-sm text-slate-500">
                Sin operaciones en el filtro. Genera una planificación primero.
              </p>
            ) : null}
          </div>
        </>
      ) : (
        <p className="text-sm text-slate-600">Cargando reportes…</p>
      )}
    </div>
  );
}
