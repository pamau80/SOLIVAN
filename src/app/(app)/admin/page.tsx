"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { apiFetch } from "@/lib/client-api";

type Payload = {
  session: { userId: string; role: string };
  profiles: Array<{ id: string; fullName: string; email: string; role: string }>;
  auditLog: Array<{
    id: string;
    action: string;
    entityType: string;
    createdAt: string;
  }>;
  shifts: Array<{ code: string; name: string; startTime: string; endTime: string }>;
};

const ROLES = ["admin", "planner", "operator", "viewer"] as const;

export default function AdminPage() {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    setData(await apiFetch<Payload>("/api/admin"));
  }

  useEffect(() => {
    load().catch((err: Error) => setError(err.message));
  }, []);

  async function setRole(role: string) {
    setError(null);
    try {
      await apiFetch("/api/admin", {
        method: "POST",
        body: JSON.stringify({ action: "setRole", role }),
      });
      setMessage(`Rol de sesión: ${role}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  async function resetDemo() {
    setError(null);
    try {
      await apiFetch("/api/admin", {
        method: "POST",
        body: JSON.stringify({ action: "resetDemo" }),
      });
      setMessage("Base local reiniciada con datos demo");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  if (!data && !error) {
    return <p className="text-sm text-slate-600">Cargando administración…</p>;
  }

  return (
    <div>
      <PageHeader
        title="Administración"
        description="Roles de sesión (base FASE 10), turnos y auditoría. RLS completa queda para Supabase en producción."
      />
      {error ? <div className="mb-4"><Alert tone="error">{error}</Alert></div> : null}
      {message ? <div className="mb-4"><Alert tone="success">{message}</Alert></div> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border bg-white p-4">
          <h3 className="text-sm font-semibold">Sesión actual</h3>
          <p className="mt-2 text-sm text-slate-700">
            Rol: <strong>{data?.session.role}</strong>
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {ROLES.map((role) => (
              <Button
                key={role}
                type="button"
                variant={data?.session.role === role ? "primary" : "secondary"}
                onClick={() => void setRole(role)}
              >
                {role}
              </Button>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-500">
            El rol viewer bloquea escrituras en API local.
          </p>
          <div className="mt-4">
            <Button type="button" variant="danger" onClick={() => void resetDemo()}>
              Reiniciar datos demo
            </Button>
          </div>
        </section>

        <section className="rounded-lg border bg-white p-4">
          <h3 className="text-sm font-semibold">Turnos</h3>
          <ul className="mt-2 space-y-1 text-sm">
            {(data?.shifts ?? []).map((shift) => (
              <li key={shift.code}>
                {shift.code} · {shift.name} · {shift.startTime}-{shift.endTime}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="mt-6 rounded-lg border bg-white p-4">
        <h3 className="text-sm font-semibold">Auditoría</h3>
        <ul className="mt-2 divide-y text-sm">
          {(data?.auditLog ?? []).map((entry) => (
            <li key={entry.id} className="flex justify-between py-2">
              <span>
                {entry.action} · {entry.entityType}
              </span>
              <span className="text-xs text-slate-400">
                {new Date(entry.createdAt).toLocaleString("es-CL")}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
