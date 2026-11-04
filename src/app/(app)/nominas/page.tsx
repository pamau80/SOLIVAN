"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { apiFetch } from "@/lib/client-api";

type Ops = {
  operations: Array<{ id: string; operationDate: string; status: string }>;
};

type Nomina = {
  rows: Array<{
    fecha: string;
    turno: string;
    proveedor: string;
    patente: string;
    orden: number;
    idExterno: string;
    nombre: string;
    estado: string;
  }>;
};

export default function NominasPage() {
  const [ops, setOps] = useState<Ops | null>(null);
  const [operationId, setOperationId] = useState("");
  const [nomina, setNomina] = useState<Nomina | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Ops>("/api/operations")
      .then((data) => {
        setOps(data);
        if (data.operations[0]) setOperationId(data.operations[0].id);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  async function loadNomina() {
    if (!operationId) return;
    setError(null);
    try {
      setNomina(
        await apiFetch<Nomina>(`/api/nominas?operationId=${operationId}`),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  return (
    <div>
      <PageHeader
        title="Nóminas operativas"
        description="Listados por operación listos para visualizar, imprimir o exportar Excel/CSV."
      />
      {error ? <div className="mb-4"><Alert tone="error">{error}</Alert></div> : null}

      <div className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border bg-white p-4 print:hidden">
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
        <Button type="button" onClick={() => void loadNomina()}>
          Cargar
        </Button>
        {operationId ? (
          <>
            <a
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              href={`/api/nominas?operationId=${operationId}&format=xlsx`}
            >
              Exportar Excel
            </a>
            <a
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              href={`/api/nominas?operationId=${operationId}&format=csv`}
            >
              Exportar CSV
            </a>
            <Button type="button" variant="secondary" onClick={() => window.print()}>
              Imprimir / PDF
            </Button>
          </>
        ) : null}
      </div>

      {nomina ? (
        <div className="overflow-hidden rounded-lg border bg-white print:border-0">
          <div className="border-b px-4 py-3 text-sm font-semibold">
            Nómina SOLIVAN
          </div>
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2 text-left">Fecha</th>
                <th className="px-3 py-2 text-left">Turno</th>
                <th className="px-3 py-2 text-left">Proveedor</th>
                <th className="px-3 py-2 text-left">Patente</th>
                <th className="px-3 py-2 text-left">#</th>
                <th className="px-3 py-2 text-left">ID</th>
                <th className="px-3 py-2 text-left">Nombre</th>
                <th className="px-3 py-2 text-left">Estado</th>
              </tr>
            </thead>
            <tbody>
              {nomina.rows.map((row, index) => (
                <tr key={`${row.idExterno}-${index}`} className="border-t">
                  <td className="px-3 py-2">{row.fecha}</td>
                  <td className="px-3 py-2">{row.turno}</td>
                  <td className="px-3 py-2">{row.proveedor}</td>
                  <td className="px-3 py-2 font-mono text-xs">{row.patente}</td>
                  <td className="px-3 py-2">{row.orden}</td>
                  <td className="px-3 py-2 font-mono text-xs">{row.idExterno}</td>
                  <td className="px-3 py-2">{row.nombre}</td>
                  <td className="px-3 py-2">{row.estado}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {nomina.rows.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">
              Sin filas. Genera una planificación primero.
            </p>
          ) : null}
        </div>
      ) : (
        <Alert tone="info">Selecciona una operación y carga la nómina.</Alert>
      )}
    </div>
  );
}
