# SOLIVAN

Plataforma web de **gestión y planificación de transporte de personas**.

Objetivo: reemplazar el proceso basado en Excel por un sistema centralizado, estandarizado y trazable.

## Stack

- Next.js (App Router) + React + TypeScript
- Tailwind CSS
- Zod
- Supabase (PostgreSQL + Auth + RLS)
- Vitest (motor de reglas)

## Inicio rápido

```bash
npm install
cp .env.example .env.local   # opcional: configurar Supabase
npm run dev
```

Sin variables de Supabase, la aplicación arranca en **modo local** con datos demo.

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run typecheck` | Verificación TypeScript |
| `npm test` | Pruebas unitarias del dominio |

## Documentación

- [Arquitectura y diagnóstico FASE 0](docs/ARCHITECTURE.md)
- [Decisiones de arquitectura](docs/DECISIONS.md)
- Migraciones SQL: `supabase/migrations/`

## Fases

Ver roadmap completo en `docs/ARCHITECTURE.md`. **FASE 1** entrega modelo de datos, shell empresarial y motor de reglas base.
