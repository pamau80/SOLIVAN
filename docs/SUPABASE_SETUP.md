# Configuración Supabase (producción)

## 1. Proyecto

1. Crea un proyecto en [Supabase](https://supabase.com).
2. Copia URL y `anon` key a `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
# Obligatorio en producción: ≥32 chars, no uses valores de ejemplo
SOLIVAN_SESSION_SECRET=$(openssl rand -hex 32)
```

## 2. Migraciones (productivas)

En el SQL Editor (o CLI `supabase db push`) aplica **solo** en orden:

1. `supabase/migrations/20261104120000_init_schema.sql`
2. `supabase/migrations/20261104140000_rls_write_policies.sql`
3. `supabase/migrations/20261104150000_profile_on_signup.sql`
4. `supabase/migrations/20261117220000_audit_rls_hardening.sql`

### Seed demo (opt-in, NO producción)

El catálogo demo vive en `supabase/seed.demo.sql` y **no** forma parte de la cadena productiva.
Aplícalo solo en ambientes de prueba:

```bash
# ejemplo CLI
psql "$DATABASE_URL" -f supabase/seed.demo.sql
```

## 3. Auth

1. Habilita Email/Password en Authentication.
2. Crea usuarios operativos.
3. Inserta filas en `profiles` con el mismo `id` que `auth.users` y el `role` correspondiente (`admin`, `planner`, `operator`, `viewer`).

Ejemplo:

```sql
insert into public.profiles (id, email, full_name, role)
values ('USER_UUID', 'planner@empresa.cl', 'Planificador', 'planner');
```

Notas de seguridad:

- Un usuario **no** puede auto-promoverse cambiando `profiles.role` (trigger de hardening).
- Sin perfil válido, el login app asigna rol `viewer` (solo lectura).
- `viewer` no lee PII de `persons` ni escribe catálogos.

## 4. Verificación

```bash
npm run dev
curl -s http://localhost:3000/api/health
```

`runtimeMode` debe ser `supabase`.

## Notas

- Sin variables Supabase, SOLIVAN opera en **modo local** con usuarios demo (ver `/login`).
- Las políticas RLS usan `public.has_role(...)` sobre `profiles`.
- Domicilios/teléfonos restringidos a roles operativos (`admin`/`planner`/`operator`).
- La fachada `src/services/catalog-facade.ts` enruta lecturas/escrituras según `runtimeMode`.
- La fachada `src/services/operations-facade.ts` enruta importación, planificación, ejecución, nóminas, reportes e historial.
- El reinicio demo y el switch de rol en `/admin` solo aplican en modo local y requieren `admin`.
- `audit_log` tiene INSERT autenticado + SELECT admin/planner.
