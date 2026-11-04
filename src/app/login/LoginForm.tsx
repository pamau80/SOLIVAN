"use client";

import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { apiFetch } from "@/lib/client-api";

type MePayload = {
  authenticated: boolean;
  runtimeMode: "local" | "supabase";
  demoUsers: Array<{ email: string; role: string; hintPassword: string }>;
};

export function LoginForm() {
  const search = useSearchParams();
  const nextPath = search.get("next") || "/dashboard";
  const [email, setEmail] = useState("planificador@solivan.local");
  const [password, setPassword] = useState("solivan-demo");
  const [error, setError] = useState<string | null>(null);
  const [me, setMe] = useState<MePayload | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiFetch<MePayload>("/api/auth/me")
      .then((data) => {
        setMe(data);
        if (data.authenticated) {
          window.location.assign(nextPath);
        }
      })
      .catch(() =>
        setMe({ authenticated: false, runtimeMode: "local", demoUsers: [] }),
      );
  }, [nextPath]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      // Navegación completa para asegurar envío de cookie httpOnly al middleware.
      window.location.assign(nextPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de autenticación");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(160deg,#0f2744_0%,#1e3a5f_45%,#f4f6f8_45%)] px-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-sky-700">
          Plataforma
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">
          SOLIVAN
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Acceso a gestión y planificación de transporte
        </p>

        {error ? (
          <div className="mt-4">
            <Alert tone="error">{error}</Alert>
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">Correo</span>
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">Contraseña</span>
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </label>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Ingresando…" : "Ingresar"}
          </Button>
        </form>

        {me?.runtimeMode === "local" ? (
          <div className="mt-5 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
            <p className="font-medium text-slate-800">Usuarios demo (modo local)</p>
            <ul className="mt-2 space-y-1">
              {(me.demoUsers ?? []).map((user) => (
                <li key={user.email}>
                  <button
                    type="button"
                    className="text-left hover:underline"
                    onClick={() => {
                      setEmail(user.email);
                      setPassword(user.hintPassword);
                    }}
                  >
                    {user.role}: {user.email}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {me?.runtimeMode === "supabase" ? (
          <p className="mt-4 text-xs text-slate-500">
            Modo Supabase: usa las credenciales de tu proyecto.
          </p>
        ) : null}
      </div>
    </div>
  );
}
