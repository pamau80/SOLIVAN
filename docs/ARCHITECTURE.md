# SOLIVAN — Arquitectura técnica

## FASE 0 — Diagnóstico (2026-11-04, America/Santiago)

### Estado encontrado

| Ítem | Resultado |
|------|-----------|
| Repositorio | `pamau80/SOLIVAN` — descripción GitHub: «SOLICITUD DE VAN» |
| Código previo | Solo `README.md` con `# SOLIVAN` |
| Framework | Ninguno |
| Backend / BD | Ninguno |
| Autenticación | Ninguna |
| Planilla de referencia | No presente en el repo |
| Funcionalidades | Ninguna implementada |

Conclusión: proyecto greenfield. No hay implementación previa que conservar. Se define stack e arquitectura desde cero.

### Decisiones de stack (justificadas)

| Capa | Tecnología | Motivo |
|------|------------|--------|
| Frontend | Next.js (App Router) + React + TypeScript estricto | App web empresarial con rutas, SSR y API colocalizadas |
| Estilos | Tailwind CSS | UI consistente y rápida sin CSS ad-hoc |
| Validación | Zod | Contratos tipados compartidos UI/API/dominio |
| Base de datos | PostgreSQL vía Supabase | Relacional normalizado + RLS nativo (requisito del proyecto) |
| Auth | Supabase Auth | Roles, sesiones y RLS alineados |
| Dominio | Módulos TypeScript puros en `src/domain` | Reglas de negocio independientes de UI y de la BD |
| Tests | Vitest | Unitarias del motor de reglas sin depender de UI |
| Migraciones | SQL versionado en `supabase/migrations` | Reproducibles y auditables |

### Principio rector

Estandarizar la operación, automatizar procesos, controlar capacidad y garantizar trazabilidad.

Dos operadores con los mismos datos y parámetros deben obtener el mismo resultado.

### Módulos funcionales

| Código | Módulo | Estado FASE 1 |
|--------|--------|---------------|
| A | Personas | Modelo + tipos |
| B | Geografía | Modelo + tipos |
| C | Proveedores | Modelo + tipos |
| D | Vehículos | Modelo + tipos |
| E | Importación de nóminas | Modelo |
| F | Motor identificación/asignación | Esqueleto de reglas |
| G | Planificación | Modelo |
| H | Nóminas operativas | Modelo |
| I | Control de ejecución | Modelo |
| J | Historial | Modelo (snapshots) |
| K | Reportería | Pendiente FASE 9 |
| L | Administración | Modelo usuarios/roles |

### Capas de código

```
src/
  app/                 # Rutas Next.js (UI + route handlers)
  components/          # UI reutilizable (sin reglas de negocio)
  domain/              # Tipos, enums, motor de reglas puro
  modules/             # Casos de uso por módulo (orquestación)
  lib/                 # Infraestructura (Supabase, env, errores)
  services/            # Adaptadores de persistencia
supabase/migrations/   # Esquema PostgreSQL + RLS base
docs/                  # Arquitectura y decisiones
```

### Seguridad (base FASE 1)

- Variables de entorno para Supabase (nunca en código).
- Esquema con RLS habilitado en tablas sensibles.
- Domicilios y teléfonos tratados como PII (columnas en tablas dedicadas / políticas restringidas).
- Validación Zod en frontera de entrada (FASES siguientes en API).

### Modo sin Supabase configurado

Si faltan `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`, la app arranca en **modo local** con repositorio en memoria para desarrollo y demostración del shell. No sustituye producción.

---

## Plan de implementación (fases)

| Fase | Alcance | Criterio de cierre |
|------|---------|--------------------|
| 0 | Auditoría | Documento de arquitectura |
| 1 | Modelo de datos + scaffold + shell | Migraciones, tipos, app arrancable, tests base |
| 2 | Personas y asignaciones habituales | CRUD + reglas de identificación |
| 3 | Geografía y flota | Zonas/comunas + proveedores/vehículos |
| 4 | Importación Excel/CSV | Mapeo, preview, lotes con errores |
| 5 | Motor identificación/asignación | Reproducible y testeado |
| 6 | Planificación y capacidad | Validación de cupos, déficit |
| 7 | Generación de nóminas | Vista / Excel / PDF |
| 8 | Ejecución e historial | Snapshots e incidencias |
| 9 | Dashboard y reportes | KPIs operacionales |
| 10 | Seguridad, optimización, E2E | RLS fina, roles, pruebas integrales |

---

## Próxima fase recomendada

**FASE 2 — Gestión de personas y asignaciones habituales**, una vez aplicadas las migraciones en un proyecto Supabase configurado.
