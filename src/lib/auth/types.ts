import type { AppRole } from "@/domain/types";

export type SessionPayload = {
  userId: string;
  email: string;
  fullName: string;
  role: AppRole;
  mode: "local" | "supabase";
  exp: number;
};

export const SESSION_COOKIE = "solivan_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 12;
