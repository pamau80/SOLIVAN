"use client";

import { FormEvent, useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { apiFetch } from "@/lib/client-api";
import type { Provider, Vehicle } from "@/domain/types";

type Payload = { providers: Provider[]; vehicles: Vehicle[] };

export default function FlotaPage() {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [providerForm, setProviderForm] = useState({ code: "", name: "" });
  const [vehicleForm, setVehicleForm] = useState({
    providerId: "",
    plate: "",
    label: "",
    authorizedCapacity: 15,
  });

  async function load() {
    setData(await apiFetch<Payload>("/api/fleet"));
  }

  useEffect(() => {
    load().catch((err: Error) => setError(err.message));
  }, []);

  async function saveProvider(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await apiFetch("/api/fleet", {
        method: "POST",
        body: JSON.stringify({ entity: "provider", ...providerForm }),
      });
      setProviderForm({ code: "", name: "" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  async function saveVehicle(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await apiFetch("/api/fleet", {
        method: "POST",
        body: JSON.stringify({
          entity: "vehicle",
          ...vehicleForm,
          providerId: vehicleForm.providerId || data?.providers[0]?.id,
          authorizedCapacity: Number(vehicleForm.authorizedCapacity),
        }),
      });
      setVehicleForm({
        providerId: vehicleForm.providerId,
        plate: "",
        label: "",
        authorizedCapacity: 15,
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  if (!data && !error) {
    return <p className="text-sm text-slate-600">Cargando flota…</p>;
  }

  return (
    <div>
      <PageHeader
        title="Flota y proveedores"
        description="Capacidad autorizada configurable. El motor de planificación y el trigger SQL impiden sobrecupo."
      />
      {error ? <div className="mb-4"><Alert tone="error">{error}</Alert></div> : null}

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <form onSubmit={saveProvider} className="space-y-2 rounded-lg border bg-white p-4">
          <h3 className="text-sm font-semibold">Proveedor</h3>
          <input className="w-full rounded-md border px-3 py-2 text-sm" placeholder="Código" value={providerForm.code} onChange={(e) => setProviderForm({ ...providerForm, code: e.target.value })} required />
          <input className="w-full rounded-md border px-3 py-2 text-sm" placeholder="Nombre" value={providerForm.name} onChange={(e) => setProviderForm({ ...providerForm, name: e.target.value })} required />
          <Button type="submit">Guardar proveedor</Button>
        </form>
        <form onSubmit={saveVehicle} className="space-y-2 rounded-lg border bg-white p-4">
          <h3 className="text-sm font-semibold">Vehículo</h3>
          <select className="w-full rounded-md border px-3 py-2 text-sm" value={vehicleForm.providerId || data?.providers[0]?.id || ""} onChange={(e) => setVehicleForm({ ...vehicleForm, providerId: e.target.value })}>
            {(data?.providers ?? []).map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <input className="w-full rounded-md border px-3 py-2 text-sm" placeholder="Patente" value={vehicleForm.plate} onChange={(e) => setVehicleForm({ ...vehicleForm, plate: e.target.value })} required />
          <input className="w-full rounded-md border px-3 py-2 text-sm" placeholder="Etiqueta" value={vehicleForm.label} onChange={(e) => setVehicleForm({ ...vehicleForm, label: e.target.value })} />
          <input className="w-full rounded-md border px-3 py-2 text-sm" type="number" min={1} value={vehicleForm.authorizedCapacity} onChange={(e) => setVehicleForm({ ...vehicleForm, authorizedCapacity: Number(e.target.value) })} required />
          <Button type="submit">Guardar vehículo</Button>
        </form>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border bg-white">
          <div className="border-b px-4 py-3 text-sm font-semibold">Proveedores</div>
          <ul className="divide-y text-sm">
            {(data?.providers ?? []).map((p) => (
              <li key={p.id} className="px-4 py-3">
                <p className="font-medium">{p.name}</p>
                <p className="text-xs text-slate-500">{p.code}</p>
              </li>
            ))}
          </ul>
        </section>
        <section className="overflow-hidden rounded-lg border bg-white">
          <div className="border-b px-4 py-3 text-sm font-semibold">Vehículos</div>
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Patente</th>
                <th className="px-4 py-3 text-left">Etiqueta</th>
                <th className="px-4 py-3 text-left">Capacidad</th>
                <th className="px-4 py-3 text-left">Estado</th>
              </tr>
            </thead>
            <tbody>
              {(data?.vehicles ?? []).map((v) => (
                <tr key={v.id} className="border-t">
                  <td className="px-4 py-3 font-mono text-xs">{v.plate}</td>
                  <td className="px-4 py-3">{v.label}</td>
                  <td className="px-4 py-3 tabular-nums">{v.authorizedCapacity}</td>
                  <td className="px-4 py-3 capitalize">{v.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
