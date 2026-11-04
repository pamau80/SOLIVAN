import { z } from "zod";
import { VehicleStatus } from "@/domain/types";
import { personDraftSchema } from "./person";
import { idSchema } from "./ids";

export { idSchema };

export const setHabitualSchema = z.object({
  action: z.literal("setHabitual"),
  personId: idSchema,
  providerId: idSchema.nullable().optional(),
  vehicleId: idSchema.nullable().optional(),
  zoneId: idSchema.nullable().optional(),
  sectorId: idSchema.nullable().optional(),
  shiftCode: z.string().nullable().optional(),
  pickupNotes: z.string().nullable().optional(),
});

export const linkAddressSchema = z.object({
  action: z.literal("linkAddress"),
  personId: idSchema,
  addressId: idSchema.nullable().optional(),
});

export const deactivatePersonSchema = z.object({
  action: z.literal("deactivate"),
  personId: idSchema,
});

export const reactivatePersonSchema = z.object({
  action: z.literal("reactivate"),
  personId: idSchema,
});

export const personsPostSchema = z.union([
  deactivatePersonSchema,
  reactivatePersonSchema,
  setHabitualSchema,
  linkAddressSchema,
  personDraftSchema,
]);

export const zoneSchema = z.object({
  entity: z.literal("zone"),
  id: idSchema.optional(),
  code: z.string().trim().min(1),
  name: z.string().trim().min(1),
});

export const communeSchema = z.object({
  entity: z.literal("commune"),
  code: z.string().trim().nullable().optional(),
  name: z.string().trim().min(1),
  region: z.string().trim().nullable().optional(),
});

export const sectorSchema = z.object({
  entity: z.literal("sector"),
  zoneId: idSchema,
  communeId: idSchema.nullable().optional(),
  code: z.string().trim().min(1),
  name: z.string().trim().min(1),
});

export const addressSchema = z.object({
  entity: z.literal("address"),
  id: idSchema.optional(),
  streetLine: z.string().trim().min(1),
  reference: z.string().trim().nullable().optional(),
  communeId: idSchema.nullable().optional(),
  sectorId: idSchema.nullable().optional(),
  zoneId: idSchema.nullable().optional(),
});

export const setActiveGeoSchema = z.object({
  entity: z.enum(["zone", "commune", "sector"]),
  action: z.enum(["deactivate", "reactivate"]),
  id: idSchema,
});

export const geographyPostSchema = z.union([
  setActiveGeoSchema,
  zoneSchema,
  communeSchema,
  sectorSchema,
  addressSchema,
]);

export const providerSchema = z.object({
  entity: z.literal("provider"),
  code: z.string().trim().min(1),
  name: z.string().trim().min(1),
});

export const vehicleSchema = z.object({
  entity: z.literal("vehicle"),
  id: idSchema.optional(),
  providerId: idSchema,
  plate: z.string().trim().min(1),
  label: z.string().trim().nullable().optional(),
  authorizedCapacity: z.number().int().positive(),
  status: z
    .enum([
      VehicleStatus.Available,
      VehicleStatus.Unavailable,
      VehicleStatus.Maintenance,
      VehicleStatus.Retired,
    ])
    .optional(),
});

export const setActiveFleetSchema = z.object({
  entity: z.enum(["provider", "vehicle"]),
  action: z.enum(["deactivate", "reactivate"]),
  id: idSchema,
});

export const fleetPostSchema = z.union([
  setActiveFleetSchema,
  providerSchema,
  vehicleSchema,
]);
