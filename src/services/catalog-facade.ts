import { getAppEnv } from "@/lib/env";
import type {
  HabitualAssignment,
  Person,
  Provider,
  Vehicle,
  Zone,
} from "@/domain/types";
import * as local from "@/services/catalog-service";
import { getDb } from "@/services/local/db";
import * as supabase from "@/services/repository/supabase-catalog";

export async function listPersonsFacade(): Promise<Person[]> {
  if (getAppEnv().runtimeMode === "supabase") {
    return supabase.supabaseListPersons();
  }
  return local.listPersons();
}

export async function listHabitualFacade(): Promise<HabitualAssignment[]> {
  if (getAppEnv().runtimeMode === "supabase") {
    return supabase.supabaseListHabitual();
  }
  return getDb().habitualAssignments.filter((h) => h.isCurrent);
}

export async function listFleetFacade(): Promise<{
  providers: Provider[];
  vehicles: Vehicle[];
}> {
  if (getAppEnv().runtimeMode === "supabase") {
    return supabase.supabaseListFleet();
  }
  return local.listFleet();
}

export async function listZonesFacade(): Promise<Zone[]> {
  if (getAppEnv().runtimeMode === "supabase") {
    return supabase.supabaseListZones();
  }
  return local.listGeography().zones;
}

export async function resolveProfileRole(
  userId: string,
): Promise<string | null> {
  if (getAppEnv().runtimeMode === "supabase") {
    return supabase.supabaseGetProfileRole(userId);
  }
  return null;
}
