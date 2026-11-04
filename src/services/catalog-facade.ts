import { getAppEnv } from "@/lib/env";
import * as local from "@/services/catalog-service";
import * as supabase from "@/services/repository/supabase-catalog";
import type {
  Address,
  Commune,
  HabitualAssignment,
  Person,
  Provider,
  Sector,
  Vehicle,
  Zone,
} from "@/domain/types";

function isSupabase() {
  return getAppEnv().runtimeMode === "supabase";
}

export async function listPersonsFacade(): Promise<Person[]> {
  if (isSupabase()) return supabase.supabaseListPersons();
  return local.listPersons();
}

export async function listHabitualFacade(): Promise<HabitualAssignment[]> {
  if (isSupabase()) return supabase.supabaseListHabitual();
  return local.listHabitualAssignments();
}

export async function listFleetFacade(): Promise<{
  providers: Provider[];
  vehicles: Vehicle[];
}> {
  if (isSupabase()) return supabase.supabaseListFleet();
  return local.listFleet();
}

export async function listZonesFacade(): Promise<Zone[]> {
  if (isSupabase()) return supabase.supabaseListZones();
  return local.listGeography().zones;
}

export async function listGeographyFacade() {
  if (isSupabase()) return supabase.supabaseListGeography();
  return local.listGeography();
}

export async function getProfileRoleFacade(
  userId: string,
): Promise<string | null> {
  if (isSupabase()) return supabase.supabaseGetProfileRole(userId);
  return null;
}

export async function upsertPersonFacade(input: unknown): Promise<Person> {
  if (isSupabase()) return supabase.supabaseUpsertPerson(input);
  return local.upsertPerson(input);
}

export async function setHabitualFacade(input: {
  personId: string;
  providerId?: string | null;
  vehicleId?: string | null;
  zoneId?: string | null;
  sectorId?: string | null;
  shiftCode?: string | null;
  pickupNotes?: string | null;
}): Promise<HabitualAssignment> {
  if (isSupabase()) return supabase.supabaseSetHabitual(input);
  return local.setHabitualAssignment(input);
}

export async function linkPersonAddressFacade(
  personId: string,
  addressId: string | null,
): Promise<Person> {
  if (isSupabase()) {
    return supabase.supabaseLinkPersonAddress(personId, addressId);
  }
  return local.linkPersonAddress(personId, addressId);
}

export async function upsertProviderFacade(input: {
  code: string;
  name: string;
}): Promise<Provider> {
  if (isSupabase()) return supabase.supabaseUpsertProvider(input);
  return local.upsertProvider(input);
}

export async function upsertVehicleFacade(input: {
  id?: string;
  providerId: string;
  plate: string;
  label?: string | null;
  authorizedCapacity: number;
  status?: Vehicle["status"];
}): Promise<Vehicle> {
  if (isSupabase()) return supabase.supabaseUpsertVehicle(input);
  return local.upsertVehicle(input);
}

export async function upsertZoneFacade(input: {
  id?: string;
  code: string;
  name: string;
}): Promise<Zone> {
  if (isSupabase()) return supabase.supabaseUpsertZone(input);
  return local.upsertZone(input);
}

export async function upsertCommuneFacade(input: {
  code?: string | null;
  name: string;
  region?: string | null;
}): Promise<Commune> {
  if (isSupabase()) return supabase.supabaseUpsertCommune(input);
  return local.upsertCommune(input);
}

export async function upsertSectorFacade(input: {
  zoneId: string;
  communeId?: string | null;
  code: string;
  name: string;
}): Promise<Sector> {
  if (isSupabase()) return supabase.supabaseUpsertSector(input);
  return local.upsertSector(input);
}

export async function upsertAddressFacade(input: {
  id?: string;
  streetLine: string;
  reference?: string | null;
  communeId?: string | null;
  sectorId?: string | null;
  zoneId?: string | null;
}): Promise<Address> {
  if (isSupabase()) return supabase.supabaseUpsertAddress(input);
  return local.upsertAddress(input);
}

export async function deactivatePersonFacade(personId: string): Promise<Person> {
  if (isSupabase()) return supabase.supabaseDeactivatePerson(personId);
  return local.deactivatePerson(personId);
}

export async function reactivatePersonFacade(personId: string): Promise<Person> {
  if (isSupabase()) return supabase.supabaseReactivatePerson(personId);
  return local.reactivatePerson(personId);
}

export async function setEntityActiveFacade(
  kind: "zone" | "commune" | "sector" | "provider" | "vehicle",
  id: string,
  isActive: boolean,
) {
  if (isSupabase()) {
    return supabase.supabaseSetEntityActive(kind, id, isActive);
  }
  return local.setEntityActive(kind, id, isActive);
}

export async function listInactivePersonsFacade(): Promise<Person[]> {
  if (isSupabase()) return supabase.supabaseListInactivePersons();
  return local.listInactivePersons();
}
