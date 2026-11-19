import type { SessionPayload } from "./types";
import { SESSION_TTL_SECONDS } from "./types";

const WEAK_SECRETS = new Set([
  "",
  "cambia-este-secreto-largo",
  "solivan-local-dev-secret",
  "ci-test-secret-not-for-production",
  "solivan-dev-only-secret-do-not-use-in-prod-32b",
  "solivan-local-dev-secret-min-32-chars!!",
]);

declare global {
  // eslint-disable-next-line no-var
  var __solivanSessionSecretFallback: string | undefined;
}

function getSecret(): string {
  const secret = process.env.SOLIVAN_SESSION_SECRET?.trim() ?? "";

  if (secret && !WEAK_SECRETS.has(secret) && secret.length >= 32) {
    return secret;
  }

  // Host de publish: CURSOR_APP_ID lo inyecta la plataforma (no va en el repo).
  const appId = process.env.CURSOR_APP_ID?.trim() ?? "";
  if (appId.length >= 8) {
    return `solivan-app-hmac-v1:${appId}`.padEnd(48, "x");
  }

  // Último recurso: secreto efímero por proceso (demo/local sin env).
  if (!globalThis.__solivanSessionSecretFallback) {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    globalThis.__solivanSessionSecretFallback = Array.from(bytes, (b) =>
      b.toString(16).padStart(2, "0"),
    ).join("");
  }
  return globalThis.__solivanSessionSecretFallback;
}

function toBase64Url(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  view.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const binary = atob(padded + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function importHmacKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

async function sign(body: string): Promise<string> {
  const key = await importHmacKey();
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(body),
  );
  return toBase64Url(signature);
}

async function verifySignature(body: string, signature: string): Promise<boolean> {
  try {
    const key = await importHmacKey();
    const raw = fromBase64Url(signature);
    const sigBytes = new Uint8Array(raw);
    return crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes,
      new TextEncoder().encode(body),
    );
  } catch {
    return false;
  }
}

export async function createSessionToken(
  input: Omit<SessionPayload, "exp">,
  ttlSeconds = SESSION_TTL_SECONDS,
): Promise<string> {
  const payload: SessionPayload = {
    ...input,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const body = toBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = await sign(body);
  return `${body}.${signature}`;
}

export async function parseSessionToken(
  token: string | undefined | null,
): Promise<SessionPayload | null> {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  if (!(await verifySignature(body, signature))) return null;
  try {
    const json = new TextDecoder().decode(fromBase64Url(body));
    const payload = JSON.parse(json) as SessionPayload;
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
