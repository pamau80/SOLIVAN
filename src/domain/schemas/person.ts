import { z } from "zod";
import { TransportCondition } from "../types";

export const transportConditionSchema = z.enum([
  TransportCondition.UsesTransport,
  TransportCondition.NoTransport,
  TransportCondition.PendingValidation,
]);

export const personDraftSchema = z.object({
  externalId: z.string().trim().min(1, "Identificador requerido"),
  nationalId: z.string().trim().min(1).nullable().optional(),
  fullName: z.string().trim().min(1, "Nombre requerido"),
  transportCondition: transportConditionSchema.default(
    TransportCondition.PendingValidation,
  ),
  phone: z.string().trim().nullable().optional(),
  email: z.string().trim().email().nullable().optional().or(z.literal("")),
  notes: z.string().nullable().optional(),
});

export type PersonDraft = z.infer<typeof personDraftSchema>;

export const importRowSchema = z.object({
  rowNumber: z.number().int().positive(),
  externalId: z.string(),
  nationalId: z.string().nullable().optional(),
  fullName: z.string(),
  transportCondition: transportConditionSchema.nullable().optional(),
});
