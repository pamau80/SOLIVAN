import { fail, ok } from "@/lib/api";
import { SESSION_COOKIE } from "@/lib/auth/types";
import { getAppEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { audit, getDb, saveDb } from "@/services/local/db";

export async function POST() {
  try {
    const env = getAppEnv();
    if (env.runtimeMode === "supabase") {
      try {
        const supabase = await createClient();
        await supabase.auth.signOut();
      } catch {
        // ignore if client not ready
      }
    } else {
      const db = getDb();
      audit("auth.logout", "profile", db.session.userId);
      saveDb();
    }

    const response = ok({ ok: true });
    response.cookies.set(SESSION_COOKIE, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });
    return response;
  } catch (error) {
    return fail(error, 500);
  }
}
