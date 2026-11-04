import { createClient } from "@/lib/supabase/server";
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
import { TransportCondition, VehicleStatus } from "@/domain/types";
import { personDraftSchema } from "@/domain/schemas/person";
import {
  addressToRow,
  communeToRow,
  habitualToRow,
  mapAddress,
  mapCommune,
  mapHabitual,
  mapPerson,
  mapProvider,
  mapSector,
  mapVehicle,
  mapZone,
  personToRow,
  providerToRow,
  sectorToRow,
  vehicleToRow,
  zoneToRow,
} from "./mappers";

async function client() {
  return createClient();
}

function newId() {
  return crypto.randomUUID();
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

export async function supabaseListInactivePersons(): Promise<Person[]> {
  const supabase = await client();
  const { data, error } = await supabase
    .from("persons")
    .select("*")
    .eq("is_active", false)
    .order("full_name");
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapPerson(row as Record<string, unknown>));
}

export async function supabaseUpsertPerson(input: unknown): Promise<Person> {
  const parsed = personDraftSchema.parse(input);
  const supabase = await client();
  const externalId = parsed.externalId.trim().toUpperCase();

  const { data: existing, error: findError } = await supabase
    .from("persons")
    .select("*")
    .eq("external_id", externalId)
    .maybeSingle();
  if (findError) throw new Error(findError.message);

  const person: Person = {
    id: existing ? String(existing.id) : newId(),
    externalId,
    nationalId: parsed.nationalId?.trim() || null,
    fullName: parsed.fullName.trim(),
    transportCondition: parsed.transportCondition,
    phone: parsed.phone?.trim() || null,
    email: parsed.email?.trim() || null,
    addressId: existing
      ? ((existing.address_id as string | null) ?? null)
      : null,
    notes: parsed.notes ?? null,
    isActive: true,
  };

  const { data, error } = await supabase
    .from("persons")
    .upsert({
      id: person.id,
      ...personToRow(person),
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapPerson(data as Record<string, unknown>);
}

export async function supabaseLinkPersonAddress(
  personId: string,
  addressId: string | null,
): Promise<Person> {
  const supabase = await client();
  if (addressId) {
    const { data: address, error: addressError } = await supabase
      .from("addresses")
      .select("id")
      .eq("id", addressId)
      .maybeSingle();
    if (addressError) throw new Error(addressError.message);
    if (!address) throw new Error("Dirección no encontrada");
  }

  const { data, error } = await supabase
    .from("persons")
    .update({
      address_id: addressId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", personId)
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

export async function supabaseSetHabitual(input: {
  personId: string;
  providerId?: string | null;
  vehicleId?: string | null;
  zoneId?: string | null;
  sectorId?: string | null;
  shiftCode?: string | null;
  pickupNotes?: string | null;
}): Promise<HabitualAssignment> {
  const supabase = await client();
  const { data: person, error: personError } = await supabase
    .from("persons")
    .select("id, transport_condition")
    .eq("id", input.personId)
    .maybeSingle();
  if (personError) throw new Error(personError.message);
  if (!person) throw new Error("Persona no encontrada");

  const today = new Date().toISOString().slice(0, 10);
  const { error: closeError } = await supabase
    .from("habitual_assignments")
    .update({ is_current: false, valid_to: today })
    .eq("person_id", input.personId)
    .eq("is_current", true);
  if (closeError) throw new Error(closeError.message);

  const assignment: HabitualAssignment = {
    id: newId(),
    personId: input.personId,
    providerId: input.providerId ?? null,
    vehicleId: input.vehicleId ?? null,
    zoneId: input.zoneId ?? null,
    sectorId: input.sectorId ?? null,
    shiftCode: input.shiftCode ?? null,
    pickupNotes: input.pickupNotes ?? null,
    validFrom: today,
    validTo: null,
    isCurrent: true,
  };

  const { data, error } = await supabase
    .from("habitual_assignments")
    .insert(habitualToRow(assignment))
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  if (person.transport_condition === TransportCondition.PendingValidation) {
    await supabase
      .from("persons")
      .update({
        transport_condition: TransportCondition.UsesTransport,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.personId);
  }

  return mapHabitual(data as Record<string, unknown>);
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

export async function supabaseUpsertProvider(input: {
  code: string;
  name: string;
}): Promise<Provider> {
  const supabase = await client();
  const code = input.code.trim().toUpperCase();
  const { data: existing, error: findError } = await supabase
    .from("providers")
    .select("*")
    .eq("code", code)
    .maybeSingle();
  if (findError) throw new Error(findError.message);

  const provider: Provider = {
    id: existing ? String(existing.id) : newId(),
    code,
    name: input.name.trim(),
    isActive: true,
  };

  const { data, error } = await supabase
    .from("providers")
    .upsert({
      ...providerToRow(provider),
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapProvider(data as Record<string, unknown>);
}

export async function supabaseUpsertVehicle(input: {
  id?: string;
  providerId: string;
  plate: string;
  label?: string | null;
  authorizedCapacity: number;
  status?: Vehicle["status"];
}): Promise<Vehicle> {
  if (input.authorizedCapacity <= 0) {
    throw new Error("La capacidad autorizada debe ser mayor a 0");
  }
  const supabase = await client();
  const plate = input.plate.trim().toUpperCase();

  const { data: provider, error: providerError } = await supabase
    .from("providers")
    .select("id")
    .eq("id", input.providerId)
    .maybeSingle();
  if (providerError) throw new Error(providerError.message);
  if (!provider) throw new Error("Proveedor no encontrado");

  let existingId = input.id;
  if (!existingId) {
    const { data: byPlate, error: plateError } = await supabase
      .from("vehicles")
      .select("id")
      .eq("plate", plate)
      .maybeSingle();
    if (plateError) throw new Error(plateError.message);
    existingId = byPlate ? String(byPlate.id) : undefined;
  }

  const vehicle: Vehicle = {
    id: existingId ?? newId(),
    providerId: input.providerId,
    plate,
    label: input.label ?? null,
    authorizedCapacity: input.authorizedCapacity,
    status: input.status ?? VehicleStatus.Available,
    isActive: true,
  };

  const { data, error } = await supabase
    .from("vehicles")
    .upsert({
      ...vehicleToRow(vehicle),
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapVehicle(data as Record<string, unknown>);
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

export async function supabaseListGeography(): Promise<{
  communes: Commune[];
  zones: Zone[];
  sectors: Sector[];
  addresses: Address[];
}> {
  const supabase = await client();
  const [communes, zones, sectors, addresses] = await Promise.all([
    supabase.from("communes").select("*").eq("is_active", true),
    supabase.from("zones").select("*").eq("is_active", true),
    supabase.from("sectors").select("*").eq("is_active", true),
    supabase.from("addresses").select("*"),
  ]);
  if (communes.error) throw new Error(communes.error.message);
  if (zones.error) throw new Error(zones.error.message);
  if (sectors.error) throw new Error(sectors.error.message);
  if (addresses.error) throw new Error(addresses.error.message);
  return {
    communes: (communes.data ?? []).map((row) =>
      mapCommune(row as Record<string, unknown>),
    ),
    zones: (zones.data ?? []).map((row) =>
      mapZone(row as Record<string, unknown>),
    ),
    sectors: (sectors.data ?? []).map((row) =>
      mapSector(row as Record<string, unknown>),
    ),
    addresses: (addresses.data ?? []).map((row) =>
      mapAddress(row as Record<string, unknown>),
    ),
  };
}

export async function supabaseUpsertZone(input: {
  id?: string;
  code: string;
  name: string;
}): Promise<Zone> {
  const supabase = await client();
  const code = input.code.trim().toUpperCase();
  let id = input.id;
  if (!id) {
    const { data: existing, error } = await supabase
      .from("zones")
      .select("id")
      .eq("code", code)
      .maybeSingle();
    if (error) throw new Error(error.message);
    id = existing ? String(existing.id) : newId();
  }
  const zone: Zone = {
    id,
    code,
    name: input.name.trim(),
    isActive: true,
  };
  const { data, error } = await supabase
    .from("zones")
    .upsert({ ...zoneToRow(zone), updated_at: new Date().toISOString() })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapZone(data as Record<string, unknown>);
}

export async function supabaseUpsertCommune(input: {
  code?: string | null;
  name: string;
  region?: string | null;
}): Promise<Commune> {
  const supabase = await client();
  const name = input.name.trim();
  const { data: existing, error: findError } = await supabase
    .from("communes")
    .select("*")
    .ilike("name", name)
    .maybeSingle();
  if (findError) throw new Error(findError.message);

  const commune: Commune = {
    id: existing ? String(existing.id) : newId(),
    code: input.code?.trim() || (existing?.code as string | null) || null,
    name,
    region:
      input.region?.trim() || (existing?.region as string | null) || null,
    isActive: true,
  };

  const { data, error } = await supabase
    .from("communes")
    .upsert({
      ...communeToRow(commune),
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapCommune(data as Record<string, unknown>);
}

export async function supabaseUpsertSector(input: {
  zoneId: string;
  communeId?: string | null;
  code: string;
  name: string;
}): Promise<Sector> {
  const supabase = await client();
  const code = input.code.trim().toUpperCase();
  const { data: existing, error: findError } = await supabase
    .from("sectors")
    .select("*")
    .eq("zone_id", input.zoneId)
    .eq("code", code)
    .maybeSingle();
  if (findError) throw new Error(findError.message);

  const sector: Sector = {
    id: existing ? String(existing.id) : newId(),
    zoneId: input.zoneId,
    communeId: input.communeId ?? (existing?.commune_id as string | null) ?? null,
    code,
    name: input.name.trim(),
    isActive: true,
  };

  const { data, error } = await supabase
    .from("sectors")
    .upsert({
      ...sectorToRow(sector),
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapSector(data as Record<string, unknown>);
}

export async function supabaseUpsertAddress(input: {
  id?: string;
  streetLine: string;
  reference?: string | null;
  communeId?: string | null;
  sectorId?: string | null;
  zoneId?: string | null;
}): Promise<Address> {
  const streetLine = input.streetLine.trim();
  if (!streetLine) throw new Error("Dirección requerida");
  const supabase = await client();

  if (input.id) {
    const { data, error } = await supabase
      .from("addresses")
      .update({
        street_line: streetLine,
        reference: input.reference?.trim() || null,
        commune_id: input.communeId ?? null,
        sector_id: input.sectorId ?? null,
        zone_id: input.zoneId ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return mapAddress(data as Record<string, unknown>);
  }

  const address: Address = {
    id: newId(),
    streetLine,
    reference: input.reference?.trim() || null,
    communeId: input.communeId ?? null,
    sectorId: input.sectorId ?? null,
    zoneId: input.zoneId ?? null,
  };

  const { data, error } = await supabase
    .from("addresses")
    .insert(addressToRow(address))
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapAddress(data as Record<string, unknown>);
}

export async function supabaseDeactivatePerson(personId: string): Promise<Person> {
  const supabase = await client();
  const today = new Date().toISOString().slice(0, 10);
  await supabase
    .from("habitual_assignments")
    .update({ is_current: false, valid_to: today })
    .eq("person_id", personId)
    .eq("is_current", true);

  const { data, error } = await supabase
    .from("persons")
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", personId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapPerson(data as Record<string, unknown>);
}

export async function supabaseReactivatePerson(personId: string): Promise<Person> {
  const supabase = await client();
  const { data, error } = await supabase
    .from("persons")
    .update({
      is_active: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", personId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapPerson(data as Record<string, unknown>);
}

export async function supabaseSetEntityActive(
  kind: "zone" | "commune" | "sector" | "provider" | "vehicle",
  id: string,
  isActive: boolean,
) {
  const table =
    kind === "zone"
      ? "zones"
      : kind === "commune"
        ? "communes"
        : kind === "sector"
          ? "sectors"
          : kind === "provider"
            ? "providers"
            : "vehicles";
  const supabase = await client();
  const { data, error } = await supabase
    .from(table)
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function supabaseGetProfileRole(
  userId: string,
): Promise<string | null> {
  const supabase = await client();
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data?.role as string | undefined) ?? null;
}
