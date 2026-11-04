import { cookies } from "next/headers";
import { getAppEnv } from "@/lib/env";
import { getDb } from "@/services/local/db";
import { parseSessionToken } from "./session-token";
import { SESSION_COOKIE } from "./types";
import type { SessionPayload } from "./types";

export async function readSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const session = await parseSessionToken(token);
  if (!session) return null;

  const env = getAppEnv();
  if (env.runtimeMode === "local") {
    // Solo memoria de proceso: no persistir en cada request (evita bucles HMR).
    const db = getDb();
    db.session.userId = session.userId;
    db.session.role = session.role;
    const profile = db.profiles.find((p) => p.id === session.userId);
    if (profile) profile.role = session.role;
  }

  return session;
}

export async function requireSession(): Promise<SessionPayload> {
  const session = await readSession();
  if (!session) {
    throw new Error("No autenticado");
  }
  return session;
}
