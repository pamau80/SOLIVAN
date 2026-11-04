import { Sidebar } from "./Sidebar";

export function AppShell({
  children,
  modeLabel,
}: {
  children: React.ReactNode;
  modeLabel: string;
}) {
  return (
    <div className="flex min-h-screen bg-[#f4f6f8] text-slate-900">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-6">
          <p className="text-sm text-slate-600">
            Operación estandarizada de transporte de personas
          </p>
          <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
            {modeLabel}
          </span>
        </header>
        <main className="flex-1 px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
