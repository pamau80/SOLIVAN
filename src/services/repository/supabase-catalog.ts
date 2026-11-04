import { createClient } from "@/lib/supabase/server";
import type { HabitualAssignment, Person, Provider, Vehicle, Zone } from "@/domain/types";
import {
  mapHabitual,
  mapPerson,
  mapProvider,
  mapVehicle,
  mapZone,
  personToRow,
} from "./mappers";

async function client() {
  return createClient();
}

export async function supabaseListPersons(): Promise<Person[]> {
  const supabase = await client();
  const { data, error } = await supabase
    .from("persons")
    .select("*")
    .eq("is_active", true)
    .order("full_name");
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapPerson(row as Record<string, unknown>));
}

export async function supabaseUpsertPerson(person: Person): Promise<Person> {
  const supabase = await client();
  const payload = {
    id: person.id,
    ...personToRow(person),
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from("persons")
    .upsert(payload)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapPerson(data as Record<string, unknown>);
}

export async function supabaseListHabitual(): Promise<HabitualAssignment[]> {
  const supabase = await client();
  const { data, error } = await supabase
    .from("habitual_assignments")
    .select("*")
    .eq("is_current", true);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapHabitual(row as Record<string, unknown>));
}

export async function supabaseListFleet(): Promise<{
  providers: Provider[];
  vehicles: Vehicle[];
}> {
  const supabase = await client();
  const [providersRes, vehiclesRes] = await Promise.all([
    supabase.from("providers").select("*").eq("is_active", true),
    supabase.from("vehicles").select("*").eq("is_active", true),
  ]);
  if (providersRes.error) throw new Error(providersRes.error.message);
  if (vehiclesRes.error) throw new Error(vehiclesRes.error.message);
  return {
    providers: (providersRes.data ?? []).map((row) =>
      mapProvider(row as Record<string, unknown>),
    ),
    vehicles: (vehiclesRes.data ?? []).map((row) =>
      mapVehicle(row as Record<string, unknown>),
    ),
  };
}

export async function supabaseListZones(): Promise<Zone[]> {
  const supabase = await client();
  const { data, error } = await supabase
    .from("zones")
    .select("*")
    .eq("is_active", true);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapZone(row as Record<string, unknown>));
}

export async function supabaseGetProfileRole(userId: string): Promise<string | null> {
  const supabase = await client();
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data?.role as string | undefined) ?? null;
}
