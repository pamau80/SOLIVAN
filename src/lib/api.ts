import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  AuthenticationError,
  AuthorizationError,
} from "@/lib/auth/errors";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, init);
}

export function fail(error: unknown, status = 400) {
  if (error instanceof ZodError) {
    const message = error.issues
      .map((issue) => `${issue.path.join(".") || "body"}: ${issue.message}`)
      .join("; ");
    return NextResponse.json({ error: message }, { status: 400 });
  }
  if (error instanceof AuthorizationError) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
  if (error instanceof AuthenticationError) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
  const message = error instanceof Error ? error.message : "Error desconocido";
  const code =
    message === "No autenticado"
      ? 401
      : message.toLowerCase().includes("solo lectura") ||
          message.toLowerCase().includes("sin permiso")
        ? 403
        : status;
  return NextResponse.json({ error: message }, { status: code });
}
