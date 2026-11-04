"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/modules/navigation/nav-items";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-slate-200 bg-[#0f2744] text-slate-100">
      <div className="border-b border-white/10 px-5 py-5">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-sky-300/90">
          Plataforma
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">
          SOLIVAN
        </h1>
        <p className="mt-1 text-xs text-slate-300">
          Gestión y planificación de transporte
        </p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const base =
            "flex items-center justify-between rounded-md px-3 py-2 text-sm transition";
          if (!item.enabled) {
            return (
              <div
                key={item.href}
                className={`${base} cursor-not-allowed text-slate-500`}
                title={`Disponible en fase ${item.phase}`}
              >
                <span>{item.label}</span>
                <span className="text-[10px] uppercase tracking-wide">
                  F{item.phase}
                </span>
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${base} ${
                active
                  ? "bg-white/10 text-white"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span>{item.label}</span>
              <span className="text-[10px] uppercase tracking-wide text-slate-400">
                {item.module}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-4 py-3 text-[11px] text-slate-400">
        Principio: estandarizar · controlar capacidad · trazabilidad
      </div>
    </aside>
  );
}
