import { NextResponse } from "next/server";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, init);
}

export function fail(error: unknown, status = 400) {
  const message = error instanceof Error ? error.message : "Error desconocido";
  return NextResponse.json({ error: message }, { status });
}
