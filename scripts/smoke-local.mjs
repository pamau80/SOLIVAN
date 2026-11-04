#!/usr/bin/env node
/**
 * Smoke local contra un servidor ya levantado (npm run dev).
 * Uso: node scripts/smoke-local.mjs [baseUrl]
 */
const base = process.argv[2] ?? "http://127.0.0.1:3000";

async function req(path, { method = "GET", body, cookie } = {}) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const setCookie = res.headers.getSetCookie?.() ?? [];
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text.slice(0, 200) };
  }
  return { status: res.status, json, setCookie };
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const login = await req("/api/auth/login", {
  method: "POST",
  body: {
    email: "planificador@solivan.local",
    password: "solivan-demo",
  },
});
assert(login.status === 200, `login ${login.status}`);
const cookie = login.setCookie.map((c) => c.split(";")[0]).join("; ");
assert(cookie.includes("solivan_session"), "sin cookie de sesión");

const date = new Date().toISOString().slice(0, 10);
const plan = await req("/api/operations", {
  method: "POST",
  cookie,
  body: { action: "plan", date, shiftCode: "A" },
});
assert(plan.status === 200, `plan ${plan.status} ${JSON.stringify(plan.json)}`);

const queue = await req(`/api/capacity-queue?date=${date}`, { cookie });
assert(queue.status === 200, `queue ${queue.status}`);

const day = await req(`/api/day-export?date=${date}`, { cookie });
assert(day.status === 200, `day-export ${day.status}`);

const health = await req("/api/health");
assert(health.status === 200, `health ${health.status}`);
assert(health.json?.data?.runtimeMode === "local", "runtimeMode esperado local");

console.log(
  JSON.stringify(
    {
      ok: true,
      base,
      runtimeMode: health.json.data.runtimeMode,
      operationId: plan.json?.data?.operation?.id,
      queueUnassigned: queue.json?.data?.totalUnassigned,
      dayNominas: day.json?.data?.nominas?.length,
    },
    null,
    2,
  ),
);
