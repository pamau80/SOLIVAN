import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional().or(z.literal("")),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional().or(z.literal("")),
});

export type AppEnv = {
  supabaseUrl: string | null;
  supabaseAnonKey: string | null;
  isSupabaseConfigured: boolean;
  runtimeMode: "supabase" | "local";
};

export function getAppEnv(): AppEnv {
  const parsed = envSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  });

  const url = parsed.success
    ? parsed.data.NEXT_PUBLIC_SUPABASE_URL || null
    : null;
  const key = parsed.success
    ? parsed.data.NEXT_PUBLIC_SUPABASE_ANON_KEY || null
    : null;

  const isSupabaseConfigured = Boolean(url && key);

  return {
    supabaseUrl: url,
    supabaseAnonKey: key,
    isSupabaseConfigured,
    runtimeMode: isSupabaseConfigured ? "supabase" : "local",
  };
}
