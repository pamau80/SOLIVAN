import { getDb } from "@/services/local/db";

/** Compatibilidad: vistas/legacy leen el snapshot actual del store local. */
export const demoStore = {
  get providers() {
    return getDb().providers;
  },
  get vehicles() {
    return getDb().vehicles;
  },
  get zones() {
    return getDb().zones;
  },
  get persons() {
    return getDb().persons;
  },
  get habitualAssignments() {
    return getDb().habitualAssignments;
  },
  get shifts() {
    return getDb().shifts;
  },
};
