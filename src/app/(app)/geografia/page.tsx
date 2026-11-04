"use client";

import { FormEvent, useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { apiFetch } from "@/lib/client-api";
import type { Address, Commune, Sector, Zone } from "@/domain/types";

type Payload = {
  communes: Commune[];
  zones: Zone[];
  sectors: Sector[];
  addresses: Address[];
};

export default function GeografiaPage() {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [zoneForm, setZoneForm] = useState({ code: "", name: "" });
  const [communeForm, setCommuneForm] = useState({
    name: "",
    code: "",
    region: "Metropolitana",
  });
  const [sectorForm, setSectorForm] = useState({
    zoneId: "",
    code: "",
    name: "",
  });
  const [addressForm, setAddressForm] = useState({
    streetLine: "",
    reference: "",
    zoneId: "",
    communeId: "",
    sectorId: "",
  });

  async function load() {
    setData(await apiFetch<Payload>("/api/geography"));
  }

  useEffect(() => {
    void load().catch((err: Error) => setError(err.message));
  }, []);

  async function submit(event: FormEvent, body: Record<string, unknown>) {
    event.preventDefault();
    setError(null);
    try {
      await apiFetch("/api/geography", {
        method: "POST",
        body: JSON.stringify(body),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  if (!data && !error) {
    return <p className="text-sm text-slate-600">Cargando geografía…</p>;
  }

  return (
    <div>
      <PageHeader
        title="Geografía"
        description="Comunas, zonas, sectores y direcciones para clasificar personas y apoyar recorridos."
      />
      {error ? (
        <div className="mb-4">
          <Alert tone="error">{error}</Alert>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        <form
          className="space-y-2 rounded-lg border border-slate-200 bg-white p-4"
          onSubmit={(e) => submit(e, { entity: "zone", ...zoneForm })}
        >
          <h3 className="text-sm font-semibold">Nueva zona</h3>
          <input className="w-full rounded-md border px-3 py-2 text-sm" placeholder="Código" value={zoneForm.code} onChange={(e) => setZoneForm({ ...zoneForm, code: e.target.value })} required />
          <input className="w-full rounded-md border px-3 py-2 text-sm" placeholder="Nombre" value={zoneForm.name} onChange={(e) => setZoneForm({ ...zoneForm, name: e.target.value })} required />
          <Button type="submit">Guardar zona</Button>
        </form>

        <form
          className="space-y-2 rounded-lg border border-slate-200 bg-white p-4"
          onSubmit={(e) => submit(e, { entity: "commune", ...communeForm })}
        >
          <h3 className="text-sm font-semibold">Nueva comuna</h3>
          <input className="w-full rounded-md border px-3 py-2 text-sm" placeholder="Nombre" value={communeForm.name} onChange={(e) => setCommuneForm({ ...communeForm, name: e.target.value })} required />
          <input className="w-full rounded-md border px-3 py-2 text-sm" placeholder="Código" value={communeForm.code} onChange={(e) => setCommuneForm({ ...communeForm, code: e.target.value })} />
          <input className="w-full rounded-md border px-3 py-2 text-sm" placeholder="Región" value={communeForm.region} onChange={(e) => setCommuneForm({ ...communeForm, region: e.target.value })} />
          <Button type="submit">Guardar comuna</Button>
        </form>

        <form
          className="space-y-2 rounded-lg border border-slate-200 bg-white p-4"
          onSubmit={(e) =>
            submit(e, {
              entity: "sector",
              ...sectorForm,
              zoneId: sectorForm.zoneId || data?.zones[0]?.id,
            })
          }
        >
          <h3 className="text-sm font-semibold">Nuevo sector</h3>
          <select className="w-full rounded-md border px-3 py-2 text-sm" value={sectorForm.zoneId || data?.zones[0]?.id || ""} onChange={(e) => setSectorForm({ ...sectorForm, zoneId: e.target.value })}>
            {(data?.zones ?? []).map((z) => (
              <option key={z.id} value={z.id}>{z.name}</option>
            ))}
          </select>
          <input className="w-full rounded-md border px-3 py-2 text-sm" placeholder="Código" value={sectorForm.code} onChange={(e) => setSectorForm({ ...sectorForm, code: e.target.value })} required />
          <input className="w-full rounded-md border px-3 py-2 text-sm" placeholder="Nombre" value={sectorForm.name} onChange={(e) => setSectorForm({ ...sectorForm, name: e.target.value })} required />
          <Button type="submit">Guardar sector</Button>
        </form>

        <form
          className="space-y-2 rounded-lg border border-slate-200 bg-white p-4"
          onSubmit={(e) =>
            submit(e, {
              entity: "address",
              streetLine: addressForm.streetLine,
              reference: addressForm.reference || null,
              zoneId: addressForm.zoneId || data?.zones[0]?.id || null,
              communeId: addressForm.communeId || data?.communes[0]?.id || null,
              sectorId: addressForm.sectorId || data?.sectors[0]?.id || null,
            })
          }
        >
          <h3 className="text-sm font-semibold">Nueva dirección</h3>
          <input className="w-full rounded-md border px-3 py-2 text-sm" placeholder="Calle y número" value={addressForm.streetLine} onChange={(e) => setAddressForm({ ...addressForm, streetLine: e.target.value })} required />
          <input className="w-full rounded-md border px-3 py-2 text-sm" placeholder="Referencia" value={addressForm.reference} onChange={(e) => setAddressForm({ ...addressForm, reference: e.target.value })} />
          <Button type="submit">Guardar dirección</Button>
        </form>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        <List title="Zonas" items={(data?.zones ?? []).map((z) => `${z.code} · ${z.name}`)} />
        <List title="Comunas" items={(data?.communes ?? []).map((c) => `${c.name}${c.region ? ` (${c.region})` : ""}`)} />
        <List title="Sectores" items={(data?.sectors ?? []).map((s) => `${s.code} · ${s.name}`)} />
        <List title="Direcciones" items={(data?.addresses ?? []).map((a) => `${a.streetLine}${a.reference ? ` (${a.reference})` : ""}`)} />
      </div>
    </div>
  );
}

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="mt-2 space-y-1 text-sm text-slate-700">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
        {items.length === 0 ? <li className="text-slate-400">Sin registros</li> : null}
      </ul>
    </section>
  );
}
