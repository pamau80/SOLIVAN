# Registro de decisiones de arquitectura (ADR ligero)

## ADR-001 — Stack greenfield Next.js + Supabase

- **Contexto:** Repo vacío; requisitos exigen React/TS, PostgreSQL y RLS.
- **Decisión:** Next.js App Router + Supabase (Postgres/Auth/RLS) + Zod + Vitest.
- **Alternativas descartadas:** Vite+SPA pura (sin API/SSR integrados); ORM pesado en FASE 1 (priorizar SQL explícito y tipos de dominio).
- **Consecuencia:** Requiere proyecto Supabase y secrets para producción.

## ADR-002 — Identificadores UUID

- **Decisión:** PK `uuid` en todas las tablas de negocio.
- **Motivo:** Evitar colisiones en importaciones y facilitar réplicas/auditoría.

## ADR-003 — Asignación habitual vs efectiva

- **Decisión:** Tablas separadas `habitual_assignments` y asignaciones por operación/viaje.
- **Motivo:** La habitual no se sobrescribe por capacidad; las excepciones quedan trazadas.

## ADR-004 — Snapshot operacional

- **Decisión:** `operation_passengers` y viajes guardan copia de campos clave al momento de planificar/ejecutar.
- **Motivo:** Historial inmutable ante cambios posteriores del maestro.

## ADR-005 — Motor de reglas en dominio puro

- **Decisión:** `src/domain/rules` sin dependencias de Next/Supabase.
- **Motivo:** Tests unitarios deterministas y mismo resultado ante mismos inputs.

## ADR-006 — Modo local sin secrets

- **Decisión:** Persistencia JSON en `.data/solivan-local.json` + singleton de proceso cuando no hay env de Supabase.
- **Motivo:** Permitir desarrollo/demo completo del ciclo operacional sin bloquear por secrets. Producción debe usar Supabase.

## ADR-007 — Excel solo como frontera

- **Decisión:** Import/export CSV/XLSX; el motor y la persistencia son independientes de planillas.
- **Motivo:** Cumplir el principio de autonomía respecto de Excel.

## ADR-008 — Autenticación dual local/Supabase

- **Decisión:** Cookie firmada HMAC (`solivan_session`) + middleware; login local demo o `signInWithPassword` si hay env Supabase.
- **Motivo:** No bloquear operación sin secrets, manteniendo camino de producción con Auth/RLS.
