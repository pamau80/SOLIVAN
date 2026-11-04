import { PageHeader } from "@/components/ui/PageHeader";
import { demoStore } from "@/services/local/demo-store";

export default function FlotaPage() {
  return (
    <div>
      <PageHeader
        title="Flota y proveedores"
        description="Capacidad autorizada configurable por vehículo. La validación de sobrecupo vive en el dominio y en el trigger SQL de trip_assignments."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-900">Proveedores</h3>
          </div>
          <ul className="divide-y divide-slate-100">
            {demoStore.providers.map((provider) => (
              <li key={provider.id} className="px-4 py-3 text-sm">
                <p className="font-medium text-slate-900">{provider.name}</p>
                <p className="text-xs text-slate-500">{provider.code}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-900">Vehículos</h3>
          </div>
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Patente</th>
                <th className="px-4 py-3 font-medium">Etiqueta</th>
                <th className="px-4 py-3 font-medium">Capacidad</th>
                <th className="px-4 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {demoStore.vehicles.map((vehicle) => (
                <tr key={vehicle.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-mono text-xs">{vehicle.plate}</td>
                  <td className="px-4 py-3">{vehicle.label}</td>
                  <td className="px-4 py-3 tabular-nums">
                    {vehicle.authorizedCapacity}
                  </td>
                  <td className="px-4 py-3 capitalize">{vehicle.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
