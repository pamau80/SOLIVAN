# SOLIVAN

Plataforma web de **gestión y planificación de transporte de personas**.

Objetivo: reemplazar el proceso basado en Excel por un sistema centralizado, estandarizado y trazable.

## Stack

- Next.js (App Router) + React + TypeScript
- Tailwind CSS + Zod + Vitest
- Supabase (PostgreSQL + Auth + RLS) — producción
- Persistencia local JSON (`.data/`) — desarrollo/demo
- Papa Parse + SheetJS — import/export CSV/Excel

## Inicio rápido

```bash
npm install
cp .env.example .env.local   # opcional
npm run dev
```

Sin variables de Supabase, la aplicación arranca en **modo local** con datos demo en `.data/`.

Abre `http://localhost:3000/login`.

### Acceso demo (modo local sin env)

| Correo | Contraseña | Rol |
|--------|------------|-----|
| `admin@solivan.local` | `solivan-admin` | admin |
| `planificador@solivan.local` | `solivan-demo` | planner |
| `operador@solivan.local` | `solivan-oper` | operator |
| `visor@solivan.local` | `solivan-view` | viewer |

Opcional: `SOLIVAN_LOCAL_USERS` (JSON) reemplaza las cuentas de muestra; `SOLIVAN_SESSION_SECRET` (≥32) endurece la cookie.

Permisos (API alineada a RLS): `viewer` solo lectura; `operator` ejecución/incidencias/personas; `planner` planifica/catálogos; `admin` además setRole/resetDemo.

Producción Supabase: ver `docs/SUPABASE_SETUP.md` (seed demo opt-in, no en migraciones).

## Módulos disponibles

| Ruta | Función |
|------|---------|
| `/dashboard` | KPIs y auditoría reciente |
| `/personas` | Ficha maestra + asignación habitual |
| `/geografia` | Zonas, comunas, sectores |
| `/flota` | Proveedores y vehículos/capacidad |
| `/importacion` | Import CSV/Excel con preview |
| `/planificacion` | Motor de cupos y viajes |
| `/nominas` | Visualización / Excel / CSV / impresión |
| `/ejecucion` | Estados, excepciones e incidencias |
| `/reportes` | Historial operacional y ocupación |
| `/historial` | Excepciones e incidencias |
| `/admin` | Roles de sesión, runtime y auditoría |

APIs útiles: `/api/capacity-queue`, `/api/day-export?date=YYYY-MM-DD&format=json-download`.

Archivo de ejemplo para importación: `public/sample-nomina.csv`.

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run verify` | typecheck + lint + test + build |
| `npm run smoke:local` | Smoke API contra `localhost:3000` |
| `npm run typecheck` | TypeScript |
| `npm test` | Pruebas unitarias (dominio + servicios) |
| `npm run lint` | ESLint |

## Documentación

- [Arquitectura](docs/ARCHITECTURE.md)
- [Decisiones](docs/DECISIONS.md)
- Migraciones SQL: `supabase/migrations/`
