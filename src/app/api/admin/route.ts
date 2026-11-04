import { fail, ok } from "@/lib/api";
import { requireSession } from "@/lib/auth/server-session";
import { createSessionToken } from "@/lib/auth/session-token";
import { SESSION_COOKIE, SESSION_TTL_SECONDS } from "@/lib/auth/types";
import { AppRole } from "@/domain/types";
import { getDb, resetDb } from "@/services/local/db";
import { setSessionRole } from "@/services/operations-service";

export async function GET() {
  try {
    const session = await requireSession();
    const db = getDb();
    return ok({
      session: {
        userId: session.userId,
        role: session.role,
        email: session.email,
        fullName: session.fullName,
      },
      profiles: db.profiles,
      auditLog: db.auditLog.slice(0, 50),
      shifts: db.shifts,
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
      if (current.role !== AppRole.Admin && current.role !== AppRole.Planner) {
        throw new Error("Solo admin/planner pueden cambiar el rol de demo");
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
      if (current.role !== AppRole.Admin && current.role !== AppRole.Planner) {
        throw new Error("Solo admin/planner pueden reiniciar datos demo");
      }
      return ok({ db: resetDb(), message: "Base local reiniciada" });
    }

    throw new Error("Acción de administración no soportada");
  } catch (error) {
    return fail(error);
  }
}
