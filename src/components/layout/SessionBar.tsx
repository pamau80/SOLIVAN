"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { apiFetch } from "@/lib/client-api";

export function SessionBar({
  modeLabel,
  userLabel,
}: {
  modeLabel: string;
  userLabel: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
      router.replace("/login");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <span className="hidden text-xs text-slate-600 sm:inline">{userLabel}</span>
      <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
        {modeLabel}
      </span>
      <Button
        type="button"
        variant="secondary"
        className="!py-1.5 text-xs"
        disabled={busy}
        onClick={() => void logout()}
      >
        Salir
      </Button>
    </div>
  );
}
