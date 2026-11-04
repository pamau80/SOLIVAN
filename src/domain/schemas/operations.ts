import { z } from "zod";
import { PassengerExecutionStatus } from "@/domain/types";
import { idSchema } from "@/domain/schemas/ids";

export const planOperationSchema = z.object({
  action: z.literal("plan"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha YYYY-MM-DD"),
  shiftCode: z.string().trim().min(1),
  personExternalIds: z.array(z.string()).optional(),
});

export const confirmOperationSchema = z.object({
  action: z.literal("confirm"),
  operationId: idSchema,
});

export const exceptionSchema = z.object({
  action: z.literal("exception"),
  operationId: idSchema,
  operationPassengerId: idSchema,
  newVehicleId: idSchema,
  reason: z.string().trim().min(5, "Motivo demasiado corto"),
});

export const executionSchema = z.object({
  action: z.literal("execution"),
  operationPassengerId: idSchema,
  status: z.enum([
    PassengerExecutionStatus.Programmed,
    PassengerExecutionStatus.Assigned,
    PassengerExecutionStatus.Transported,
    PassengerExecutionStatus.Absent,
    PassengerExecutionStatus.Cancelled,
    PassengerExecutionStatus.Reassigned,
  ]),
});

export const incidentSchema = z.object({
  action: z.literal("incident"),
  operationId: idSchema,
  category: z.string().trim().min(2),
  description: z.string().trim().min(3),
  tripId: idSchema.nullable().optional(),
  operationPassengerId: idSchema.nullable().optional(),
});

export const operationsPostSchema = z.discriminatedUnion("action", [
  planOperationSchema,
  confirmOperationSchema,
  exceptionSchema,
  executionSchema,
  incidentSchema,
]);

export const importPreviewSchema = z.object({
  action: z.literal("preview"),
  filename: z.string().trim().min(1),
  mapping: z.record(z.string(), z.string()),
  rows: z.array(z.record(z.string(), z.unknown())).min(1),
});

export const importCommitSchema = z.object({
  action: z.literal("commit"),
  filename: z.string().trim().min(1),
  mapping: z.record(z.string(), z.string()),
  rows: z.array(z.record(z.string(), z.unknown())).min(1),
  createMissingPersons: z.boolean().optional(),
});

export const importPostSchema = z.discriminatedUnion("action", [
  importPreviewSchema,
  importCommitSchema,
]);

export const dayExportSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});
