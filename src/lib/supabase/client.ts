import { createBrowserClient } from "@supabase/ssr";
import { getAppEnv } from "@/lib/env";

export function createClient() {
  const env = getAppEnv();
  if (!env.isSupabaseConfigured || !env.supabaseUrl || !env.supabaseAnonKey) {
    throw new Error(
      "Supabase no configurado. Define NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  return createBrowserClient(env.supabaseUrl, env.supabaseAnonKey);
}
