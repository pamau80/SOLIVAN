/**
 * Solo permite redirecciones internas relativas (anti open-redirect).
 */
export function safeInternalPath(
  candidate: string | null | undefined,
  fallback = "/dashboard",
): string {
  if (!candidate) return fallback;
  const value = candidate.trim();
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//")) return fallback;
  if (value.includes("://")) return fallback;
  if (/[\r\n\\]/.test(value)) return fallback;
  return value;
}
