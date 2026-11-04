"use client";

import { FormEvent, useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { apiFetch } from "@/lib/client-api";
import type { HabitualAssignment, Person, Vehicle, Zone } from "@/domain/types";

type Payload = {
  persons: Person[];
  habitualAssignments: HabitualAssignment[];
  vehicles: Vehicle[];
  zones: Zone[];
};

const conditionLabel: Record<string, string> = {
  uses_transport: "Usa transporte",
  no_transport: "No usa transporte",
  pending_validation: "Pendiente",
};

export default function PersonasPage() {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    externalId: "",
    fullName: "",
    nationalId: "",
    transportCondition: "uses_transport",
  });

  async function load() {
    const payload = await apiFetch<Payload>("/api/persons");
    setData(payload);
  }

  useEffect(() => {
    load().catch((err: Error) => setError(err.message));
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    try {
      await apiFetch("/api/persons", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          nationalId: form.nationalId || null,
        }),
      });
      setMessage("Persona guardada");
      setForm({
        externalId: "",
        fullName: "",
        nationalId: "",
        transportCondition: "uses_transport",
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  async function assignHabitual(personId: string, vehicleId: string) {
    setError(null);
    try {
      const vehicle = data?.vehicles.find((v) => v.id === vehicleId);
      await apiFetch("/api/persons", {
        method: "POST",
        body: JSON.stringify({
          action: "setHabitual",
          personId,
          vehicleId,
          providerId: vehicle?.providerId ?? null,
          zoneId: data?.zones[0]?.id ?? null,
          shiftCode: "A",
        }),
      });
      setMessage("Asignación habitual actualizada");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  if (!data && !error) {
    return <p className="text-sm text-slate-600">Cargando personas…</p>;
  }

  const habitualByPerson = new Map(
    (data?.habitualAssignments ?? []).map((h) => [h.personId, h]),
  );

  return (
    <div>
      <PageHeader
        title="Personas"
        description="Ficha maestra, condición de transporte y asignación habitual (sin sobrescribir por capacidad)."
      />

      {error ? <div className="mb-4"><Alert tone="error">{error}</Alert></div> : null}
      {message ? <div className="mb-4"><Alert tone="success">{message}</Alert></div> : null}

      <form
        onSubmit={onSubmit}
        className="mb-6 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-5"
      >
        <input
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          placeholder="ID externo"
          value={form.externalId}
          onChange={(e) => setForm({ ...form, externalId: e.target.value })}
          required
        />
        <input
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          placeholder="Nombre completo"
          value={form.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          required
        />
        <input
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          placeholder="RUT (opcional)"
          value={form.nationalId}
          onChange={(e) => setForm({ ...form, nationalId: e.target.value })}
        />
        <select
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          value={form.transportCondition}
          onChange={(e) =>
            setForm({ ...form, transportCondition: e.target.value })
          }
        >
          <option value="uses_transport">Usa transporte</option>
          <option value="no_transport">No usa transporte</option>
          <option value="pending_validation">Pendiente</option>
        </select>
        <Button type="submit">Guardar persona</Button>
      </form>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Condición</th>
              <th className="px-4 py-3">Habitual</th>
              <th className="px-4 py-3">Asignar</th>
            </tr>
          </thead>
          <tbody>
            {(data?.persons ?? []).map((person) => {
              const habitual = habitualByPerson.get(person.id);
              const vehicle = data?.vehicles.find(
                (v) => v.id === habitual?.vehicleId,
              );
              return (
                <tr key={person.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-mono text-xs">
                    {person.externalId}
                  </td>
                  <td className="px-4 py-3">{person.fullName}</td>
                  <td className="px-4 py-3">
                    {conditionLabel[person.transportCondition]}
                  </td>
                  <td className="px-4 py-3">
                    {vehicle ? `${vehicle.plate}` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                      defaultValue=""
                      onChange={(e) => {
                        if (e.target.value) {
                          void assignHabitual(person.id, e.target.value);
                        }
                      }}
                    >
                      <option value="">Seleccionar van…</option>
                      {(data?.vehicles ?? []).map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.plate} ({v.authorizedCapacity})
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
