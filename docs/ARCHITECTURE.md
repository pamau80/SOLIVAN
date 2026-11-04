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
| A | Personas | CRUD + habituales (API/UI) |
| B | Geografía | CRUD zonas/comunas/sectores |
| C | Proveedores | CRUD |
| D | Vehículos | CRUD + capacidad |
| E | Importación de nóminas | CSV/Excel preview+commit |
| F | Motor identificación/asignación | Reglas + planning |
| G | Planificación | Generación viajes + cupos |
| H | Nóminas operativas | Vista/CSV/XLSX/print |
| I | Control de ejecución | Estados + incidencias |
| J | Historial | `/historial` excepciones + incidencias |
| K | Reportería | Dashboard + `/reportes` + export CSV |
| L | Administración | Roles sesión + reset demo + export auditoría |

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

## Estado actual

Fases 1–10 operativas en modo local con autenticación, APIs protegidas y ciclo completo.

## Próximo paso recomendado

Conectar proyecto Supabase real (`docs/SUPABASE_SETUP.md`), migrar datos demo y endurecer auth (MFA, recuperación de clave, service role solo en server).
