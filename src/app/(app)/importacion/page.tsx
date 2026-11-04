"use client";

import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { apiFetch } from "@/lib/client-api";

type Preview = {
  filename: string;
  mapping: Record<string, string>;
  rowCount: number;
  errorCount: number;
  newCount: number;
  duplicateCount: number;
  preview: Array<{
    rowNumber: number;
    externalId: string;
    fullName: string;
    isNewPerson: boolean;
    isDuplicateInBatch: boolean;
    issues: Array<{ message: string }>;
  }>;
};

const FIELDS = [
  { key: "externalId", label: "ID externo" },
  { key: "fullName", label: "Nombre" },
  { key: "nationalId", label: "RUT" },
  { key: "transportCondition", label: "Usa transporte" },
] as const;

export default function ImportacionPage() {
  const [filename, setFilename] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<Preview | null>(null);
  const [batches, setBatches] = useState<Array<{ id: string; sourceFilename: string; status: string; rowCount: number; errorCount: number }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ batches: typeof batches }>("/api/import")
      .then((data) => setBatches(data.batches))
      .catch((err: Error) => setError(err.message));
  }, []);

  const canPreview = useMemo(
    () => Boolean(mapping.externalId && mapping.fullName && rows.length),
    [mapping, rows.length],
  );

  async function onFile(file: File) {
    setError(null);
    setPreview(null);
    setFilename(file.name);
    const buffer = await file.arrayBuffer();
    let parsedRows: Record<string, unknown>[] = [];

    if (file.name.toLowerCase().endsWith(".csv")) {
      const text = new TextDecoder().decode(buffer);
      const result = Papa.parse<Record<string, unknown>>(text, {
        header: true,
        skipEmptyLines: true,
      });
      parsedRows = result.data;
    } else {
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      parsedRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: "",
      });
    }

    const cols = Object.keys(parsedRows[0] ?? {});
    setHeaders(cols);
    setRows(parsedRows);
    setMapping({
      externalId: cols.find((c) => /id|codigo|código|external/i.test(c)) ?? cols[0] ?? "",
      fullName: cols.find((c) => /nombre|name/i.test(c)) ?? cols[1] ?? "",
      nationalId: cols.find((c) => /rut|national/i.test(c)) ?? "",
      transportCondition: cols.find((c) => /transporte|transport/i.test(c)) ?? "",
    });
  }

  async function runPreview() {
    setError(null);
    try {
      const data = await apiFetch<Preview>("/api/import", {
        method: "POST",
        body: JSON.stringify({
          action: "preview",
          filename,
          mapping,
          rows,
        }),
      });
      setPreview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  async function commit() {
    setError(null);
    setMessage(null);
    try {
      await apiFetch("/api/import", {
        method: "POST",
        body: JSON.stringify({
          action: "commit",
          filename,
          mapping,
          rows,
          createMissingPersons: true,
        }),
      });
      setMessage("Importación confirmada");
      const data = await apiFetch<{ batches: typeof batches }>("/api/import");
      setBatches(data.batches);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  return (
    <div>
      <PageHeader
        title="Importación de nóminas"
        description="CSV/Excel con mapeo de columnas, validación, preview y confirmación controlada."
      />
      {error ? <div className="mb-4"><Alert tone="error">{error}</Alert></div> : null}
      {message ? <div className="mb-4"><Alert tone="success">{message}</Alert></div> : null}

      <div className="rounded-lg border bg-white p-4">
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void onFile(file);
          }}
        />
        {filename ? (
          <p className="mt-2 text-sm text-slate-600">
            Archivo: <strong>{filename}</strong> · {rows.length} filas
          </p>
        ) : null}

        {headers.length > 0 ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {FIELDS.map((field) => (
              <label key={field.key} className="text-sm">
                <span className="mb-1 block text-slate-600">{field.label}</span>
                <select
                  className="w-full rounded-md border px-2 py-2"
                  value={mapping[field.key] ?? ""}
                  onChange={(e) =>
                    setMapping({ ...mapping, [field.key]: e.target.value })
                  }
                >
                  <option value="">—</option>
                  {headers.map((header) => (
                    <option key={header} value={header}>
                      {header}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        ) : null}

        <div className="mt-4 flex gap-2">
          <Button type="button" disabled={!canPreview} onClick={() => void runPreview()}>
            Validar / preview
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={!preview}
            onClick={() => void commit()}
          >
            Confirmar importación
          </Button>
        </div>
      </div>

      {preview ? (
        <div className="mt-6 rounded-lg border bg-white p-4">
          <p className="text-sm text-slate-700">
            Filas {preview.rowCount} · errores {preview.errorCount} · nuevas{" "}
            {preview.newCount} · duplicados {preview.duplicateCount}
          </p>
          <div className="mt-3 max-h-80 overflow-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Fila</th>
                  <th className="px-3 py-2">ID</th>
                  <th className="px-3 py-2">Nombre</th>
                  <th className="px-3 py-2">Estado</th>
                  <th className="px-3 py-2">Issues</th>
                </tr>
              </thead>
              <tbody>
                {preview.preview.slice(0, 50).map((row) => (
                  <tr key={row.rowNumber} className="border-t">
                    <td className="px-3 py-2">{row.rowNumber}</td>
                    <td className="px-3 py-2 font-mono text-xs">{row.externalId}</td>
                    <td className="px-3 py-2">{row.fullName}</td>
                    <td className="px-3 py-2">
                      {row.isDuplicateInBatch
                        ? "Duplicado"
                        : row.isNewPerson
                          ? "Nueva"
                          : "Existente"}
                    </td>
                    <td className="px-3 py-2 text-xs text-rose-700">
                      {row.issues.map((i) => i.message).join("; ") || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <section className="mt-6 rounded-lg border bg-white p-4">
        <h3 className="text-sm font-semibold">Lotes recientes</h3>
        <ul className="mt-2 space-y-1 text-sm">
          {batches.map((batch) => (
            <li key={batch.id}>
              {batch.sourceFilename} · {batch.status} · {batch.rowCount} filas ·{" "}
              {batch.errorCount} errores
            </li>
          ))}
          {batches.length === 0 ? (
            <li className="text-slate-500">Sin lotes todavía.</li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
