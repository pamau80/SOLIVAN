# Configuración Supabase (producción)

## 1. Proyecto

1. Crea un proyecto en [Supabase](https://supabase.com).
2. Copia URL y `anon` key a `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SOLIVAN_SESSION_SECRET=cambia-este-secreto-largo
```

## 2. Migraciones

En el SQL Editor (o CLI `supabase db push`) aplica en orden:

1. `supabase/migrations/20261104120000_init_schema.sql`
2. `supabase/migrations/20261104140000_rls_write_policies.sql`

## 3. Auth

1. Habilita Email/Password en Authentication.
2. Crea usuarios operativos.
3. Inserta filas en `profiles` con el mismo `id` que `auth.users` y el `role` correspondiente (`admin`, `planner`, `operator`, `viewer`).

Ejemplo:

```sql
insert into public.profiles (id, email, full_name, role)
values ('USER_UUID', 'planner@empresa.cl', 'Planificador', 'planner');
```

## 4. Verificación

```bash
npm run dev
curl -s http://localhost:3000/api/health
```

`runtimeMode` debe ser `supabase`.

## Notas

- Sin estas variables, SOLIVAN opera en **modo local** con usuarios demo (ver pantalla `/login`).
- Las políticas RLS usan `public.has_role(...)` sobre `profiles`.
- Domicilios/teléfonos permanecen restringidos a roles operativos.
