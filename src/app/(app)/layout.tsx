import { AppShell } from "@/components/layout/AppShell";
import { getAppEnv } from "@/lib/env";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const env = getAppEnv();
  const modeLabel =
    env.runtimeMode === "supabase"
      ? "Modo Supabase"
      : "Modo local (demo)";

  return <AppShell modeLabel={modeLabel}>{children}</AppShell>;
}
