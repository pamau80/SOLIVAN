import { Sidebar } from "./Sidebar";
import { SessionBar } from "./SessionBar";

export function AppShell({
  children,
  modeLabel,
  userLabel,
}: {
  children: React.ReactNode;
  modeLabel: string;
  userLabel: string;
}) {
  return (
    <div className="flex min-h-screen bg-[#f4f6f8] text-slate-900">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-6">
          <p className="text-sm text-slate-600">
            Operación estandarizada de transporte de personas
          </p>
          <SessionBar modeLabel={modeLabel} userLabel={userLabel} />
        </header>
        <main className="flex-1 px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
