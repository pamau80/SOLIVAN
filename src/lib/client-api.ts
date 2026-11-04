export async function apiFetch<T>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(url, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (response.status === 401 && !url.startsWith("/api/auth/")) {
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
      const next = encodeURIComponent(window.location.pathname);
      // Redirección full-page: la sesión expiró fuera del árbol de React.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- recovery de 401
      window.location.assign(`/login?next=${next}`);
    }
    throw new Error("No autenticado");
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error ?? `Error HTTP ${response.status}`);
  }
  return payload.data as T;
}
