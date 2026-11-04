import { PageHeader } from "@/components/ui/PageHeader";
import { demoStore } from "@/services/local/demo-store";

const conditionLabel: Record<string, string> = {
  uses_transport: "Usa transporte",
  no_transport: "No usa transporte",
  pending_validation: "Pendiente",
};

export default function PersonasPage() {
  const habitualByPerson = new Map(
    demoStore.habitualAssignments.map((item) => [item.personId, item]),
  );

  return (
    <div>
      <PageHeader
        title="Personas"
        description="Ficha maestra y condición de transporte. CRUD completo e importación llegan en FASE 2–4; aquí se valida el modelo con datos demo."
      />

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">ID externo</th>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Condición</th>
              <th className="px-4 py-3 font-medium">Asignación habitual</th>
            </tr>
          </thead>
          <tbody>
            {demoStore.persons.map((person) => {
              const habitual = habitualByPerson.get(person.id);
              const vehicle = demoStore.vehicles.find(
                (item) => item.id === habitual?.vehicleId,
              );
              return (
                <tr key={person.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-mono text-xs text-slate-700">
                    {person.externalId}
                  </td>
                  <td className="px-4 py-3 text-slate-900">{person.fullName}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {conditionLabel[person.transportCondition]}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {vehicle ? `${vehicle.plate} · ${vehicle.label}` : "—"}
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
