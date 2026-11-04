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
cp .env.example .env.local   # opcional: configurar Supabase
npm run dev
```

Sin variables de Supabase, la aplicación arranca en **modo local** con datos demo persistidos en `.data/`.

Abre `http://localhost:3000`.

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
| `/admin` | Roles de sesión y reset demo |

Archivo de ejemplo: `public/sample-nomina.csv`.

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run typecheck` | TypeScript |
| `npm test` | Pruebas unitarias (dominio + servicios) |
| `npm run lint` | ESLint |

## Documentación

- [Arquitectura](docs/ARCHITECTURE.md)
- [Decisiones](docs/DECISIONS.md)
- Migraciones SQL: `supabase/migrations/`
