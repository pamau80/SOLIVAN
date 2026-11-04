import { z } from "zod";

/** Acepta UUID RFC y IDs demo locales (hex con guiones). */
export const idSchema = z
  .string()
  .trim()
  .regex(
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
    "ID inválido",
  );
