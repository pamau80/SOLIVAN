import { AppShell } from "@/components/layout/AppShell";
import { readSession } from "@/lib/auth/server-session";
import { getAppEnv } from "@/lib/env";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const env = getAppEnv();
  const session = await readSession();
  const modeLabel =
    env.runtimeMode === "supabase" ? "Modo Supabase" : "Modo local (demo)";
  const userLabel = session
    ? `${session.fullName} · ${session.role}`
    : "Sin sesión";

  return (
    <AppShell modeLabel={modeLabel} userLabel={userLabel}>
      {children}
    </AppShell>
  );
}
