import { fail, ok } from "@/lib/api";
import { assertPermission } from "@/lib/auth/assert-write";
import { requireSession } from "@/lib/auth/server-session";
import { createSessionToken } from "@/lib/auth/session-token";
import { SESSION_COOKIE, SESSION_TTL_SECONDS } from "@/lib/auth/types";
import { getAppEnv } from "@/lib/env";
import { getDb, resetDb } from "@/services/local/db";
import { setSessionRole } from "@/services/operations-service";

export async function GET() {
  try {
    const session = await requireSession();
    assertPermission(session, "admin.read");
    const db = getDb();
    const env = getAppEnv();
    return ok({
      session: {
        userId: session.userId,
        role: session.role,
        email: session.email,
        fullName: session.fullName,
        mode: session.mode,
      },
      profiles: db.profiles,
      auditLog: db.auditLog.slice(0, 50),
      shifts: db.shifts,
      runtimeMode: env.runtimeMode,
      supabaseConfigured: env.isSupabaseConfigured,
    });
  } catch (error) {
    return fail(error, 401);
  }
}

export async function POST(request: Request) {
  try {
    const current = await requireSession();
    const body = await request.json();

    if (body?.action === "setRole") {
      assertPermission(current, "admin.setRole");
      if (getAppEnv().runtimeMode === "supabase") {
        throw new Error(
          "Cambio de rol demo solo disponible en modo local (sin Supabase)",
        );
      }
      const session = setSessionRole(body.role);
      const profile = getDb().profiles.find((p) => p.id === session.userId);
      const token = await createSessionToken({
        userId: session.userId,
        email: profile?.email ?? current.email,
        fullName: profile?.fullName ?? current.fullName,
        role: session.role,
        mode: current.mode,
      });
      const response = ok({ session });
      response.cookies.set(SESSION_COOKIE, token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: SESSION_TTL_SECONDS,
      });
      return response;
    }

    if (body?.action === "resetDemo") {
      assertPermission(current, "admin.resetDemo");
      if (getAppEnv().runtimeMode === "supabase") {
        throw new Error(
          "Reinicio demo solo disponible en modo local (sin Supabase)",
        );
      }
      return ok({ db: resetDb(), message: "Base local reiniciada" });
    }

    if (body?.action === "exportAudit") {
      assertPermission(current, "admin.exportAudit");
      const rows = getDb().auditLog.map((entry) => ({
        id: entry.id,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId ?? "",
        createdAt: entry.createdAt,
      }));
      const header = "id,action,entityType,entityId,createdAt";
      const csv = [
        header,
        ...rows.map((r) =>
          [r.id, r.action, r.entityType, r.entityId, r.createdAt]
            .map((v) => `"${String(v).replaceAll('"', '""')}"`)
            .join(","),
        ),
      ].join("\n");
      return ok({ csv, count: rows.length });
    }

    throw new Error("Acción de administración no soportada");
  } catch (error) {
    return fail(error);
  }
}
