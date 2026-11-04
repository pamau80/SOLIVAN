import { z } from "zod";
import { findLocalUser } from "@/lib/auth/local-users";
import { createSessionToken } from "@/lib/auth/session-token";
import { SESSION_COOKIE, SESSION_TTL_SECONDS } from "@/lib/auth/types";
import { fail, ok } from "@/lib/api";
import { getAppEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { audit, getDb, saveDb } from "@/services/local/db";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = loginSchema.parse(await request.json());
    const env = getAppEnv();

    if (env.runtimeMode === "supabase") {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: body.email,
        password: body.password,
      });
      if (error || !data.user) {
        throw new Error(error?.message || "Credenciales inválidas");
      }

      const token = await createSessionToken({
        userId: data.user.id,
        email: data.user.email ?? body.email,
        fullName:
          (data.user.user_metadata?.full_name as string | undefined) ??
          data.user.email ??
          body.email,
        role: "planner",
        mode: "supabase",
      });

      const response = ok({
        user: {
          id: data.user.id,
          email: data.user.email,
          mode: "supabase",
        },
      });
      response.cookies.set(SESSION_COOKIE, token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: SESSION_TTL_SECONDS,
      });
      return response;
    }

    const user = findLocalUser(body.email, body.password);
    if (!user) throw new Error("Credenciales inválidas");

    const db = getDb();
    let profile = db.profiles.find((p) => p.id === user.id);
    if (!profile) {
      profile = {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isActive: true,
      };
      db.profiles.push(profile);
    } else {
      profile.role = user.role;
      profile.fullName = user.fullName;
      profile.isActive = true;
    }
    db.session = { userId: user.id, role: user.role };
    audit("auth.login", "profile", user.id, { email: user.email });
    saveDb();

    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      mode: "local",
    });

    const response = ok({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        mode: "local",
      },
    });
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_TTL_SECONDS,
    });
    return response;
  } catch (error) {
    return fail(error, 401);
  }
}
