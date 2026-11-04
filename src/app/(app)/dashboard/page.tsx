import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { summarizeCapacity } from "@/domain/rules";
import { getAppEnv } from "@/lib/env";
import { demoStore } from "@/services/local/demo-store";

export default function DashboardPage() {
  const env = getAppEnv();
  const personsUsingTransport = demoStore.persons.filter(
    (person) => person.transportCondition === "uses_transport",
  ).length;

  const capacity = summarizeCapacity({
    passengersScheduled: personsUsingTransport,
    vehicles: demoStore.vehicles.map((vehicle) => ({
      vehicle,
      assignedPassengers: 0,
    })),
  });

  return (
    <div>
      <PageHeader
        title="Dashboard operacional"
        description="Vista inicial de SOLIVAN. En FASE 1 el foco es el modelo de datos, el shell empresarial y el motor de reglas base."
      />

      <div className="mb-6 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950">
        Runtime: <strong>{env.runtimeMode}</strong>.
        {env.runtimeMode === "local"
          ? " Configura Supabase con las variables de entorno para conectar PostgreSQL real."
          : " Conectado a Supabase."}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Personas (demo)"
          value={demoStore.persons.length}
          hint={`${personsUsingTransport} usan transporte`}
        />
        <StatCard
          label="Vehículos disponibles"
          value={capacity.vehiclesAvailable}
          hint={`Capacidad total ${capacity.totalAvailableCapacity}`}
        />
        <StatCard
          label="Mín. teórico vehículos"
          value={
            Number.isFinite(capacity.vehiclesRequiredTheoreticalMin)
              ? capacity.vehiclesRequiredTheoreticalMin
              : "—"
          }
          hint="No equivale a vehículos físicos necesarios"
        />
        <StatCard
          label="Asignaciones habituales"
          value={demoStore.habitualAssignments.length}
          hint="Independientes de cada operación"
        />
      </div>

      <section className="mt-8 rounded-lg border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-slate-900">
          Fases del roadmap
        </h3>
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-slate-700">
          <li>Modelo de datos y configuración (actual)</li>
          <li>Personas y asignaciones habituales</li>
          <li>Geografía y flota</li>
          <li>Importación de nóminas</li>
          <li>Motor de identificación y asignación</li>
          <li>Planificación y capacidad</li>
          <li>Generación de nóminas</li>
          <li>Ejecución e historial</li>
          <li>Reportería</li>
          <li>Seguridad y pruebas integrales</li>
        </ol>
      </section>
    </div>
  );
}
