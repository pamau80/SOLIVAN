import { TransportCondition } from "../types";
import type { HabitualAssignment, Person } from "../types";

export interface ImportPersonRow {
  rowNumber: number;
  externalId: string;
  nationalId?: string | null;
  fullName: string;
  transportCondition?: TransportCondition | null;
}

export type IdentificationIssueCode =
  | "missing_external_id"
  | "missing_full_name"
  | "duplicate_in_batch"
  | "duplicate_existing"
  | "incomplete_for_planning";

export interface IdentificationIssue {
  code: IdentificationIssueCode;
  message: string;
  rowNumber?: number;
  externalId?: string;
}

export interface IdentifiedPersonResult {
  rowNumber: number;
  externalId: string;
  fullName: string;
  matchedPerson: Person | null;
  isNewPerson: boolean;
  isDuplicateInBatch: boolean;
  issues: IdentificationIssue[];
  transportCondition: TransportCondition;
  habitualAssignment: HabitualAssignment | null;
}

export interface IdentificationInput {
  rows: ImportPersonRow[];
  existingPersons: Person[];
  habitualByPersonId: Map<string, HabitualAssignment>;
}

function normalizeId(value: string | null | undefined): string {
  return (value ?? "").trim().toUpperCase();
}

/**
 * Identifica personas de una nómina importada de forma determinista.
 * Ante los mismos inputs, produce el mismo resultado.
 */
export function identifyPersons(
  input: IdentificationInput,
): IdentifiedPersonResult[] {
  const byExternal = new Map(
    input.existingPersons.map((person) => [
      normalizeId(person.externalId),
      person,
    ]),
  );
  const byNational = new Map(
    input.existingPersons
      .filter((person) => person.nationalId)
      .map((person) => [normalizeId(person.nationalId), person]),
  );

  const seenInBatch = new Map<string, number>();

  return input.rows.map((row) => {
    const issues: IdentificationIssue[] = [];
    const externalId = normalizeId(row.externalId);
    const nationalId = normalizeId(row.nationalId);
    const fullName = row.fullName.trim();

    if (!externalId) {
      issues.push({
        code: "missing_external_id",
        message: "Identificador externo vacío",
        rowNumber: row.rowNumber,
      });
    }

    if (!fullName) {
      issues.push({
        code: "missing_full_name",
        message: "Nombre incompleto",
        rowNumber: row.rowNumber,
        externalId: externalId || undefined,
      });
    }

    let isDuplicateInBatch = false;
    if (externalId) {
      const previous = seenInBatch.get(externalId);
      if (previous !== undefined) {
        isDuplicateInBatch = true;
        issues.push({
          code: "duplicate_in_batch",
          message: `Duplicado en lote (fila ${previous})`,
          rowNumber: row.rowNumber,
          externalId,
        });
      } else {
        seenInBatch.set(externalId, row.rowNumber);
      }
    }

    const matchedPerson =
      (externalId ? byExternal.get(externalId) : undefined) ??
      (nationalId ? byNational.get(nationalId) : undefined) ??
      null;

    if (matchedPerson && externalId && byExternal.has(externalId) === false) {
      issues.push({
        code: "duplicate_existing",
        message: "Coincide por RUT/nacional con otra ficha",
        rowNumber: row.rowNumber,
        externalId,
      });
    }

    const transportCondition =
      row.transportCondition ??
      matchedPerson?.transportCondition ??
      TransportCondition.PendingValidation;

    const habitualAssignment = matchedPerson
      ? (input.habitualByPersonId.get(matchedPerson.id) ?? null)
      : null;

    if (
      transportCondition === TransportCondition.UsesTransport &&
      !habitualAssignment
    ) {
      issues.push({
        code: "incomplete_for_planning",
        message: "Usa transporte pero no tiene asignación habitual",
        rowNumber: row.rowNumber,
        externalId: externalId || undefined,
      });
    }

    return {
      rowNumber: row.rowNumber,
      externalId,
      fullName,
      matchedPerson,
      isNewPerson: !matchedPerson && Boolean(externalId) && Boolean(fullName),
      isDuplicateInBatch,
      issues,
      transportCondition,
      habitualAssignment,
    };
  });
}

export function filterEligibleForPlanning(
  results: IdentifiedPersonResult[],
): IdentifiedPersonResult[] {
  return results.filter((result) => {
    if (result.isDuplicateInBatch) return false;
    if (result.issues.some((issue) => issue.code === "missing_external_id")) {
      return false;
    }
    if (result.transportCondition !== TransportCondition.UsesTransport) {
      return false;
    }
    return result.issues.every(
      (issue) => issue.code !== "incomplete_for_planning",
    );
  });
}
