import { createClient } from "@/lib/supabase/server";

export async function supabaseAudit(
  action: string,
  entityType: string,
  entityId: string | null,
  payload: Record<string, unknown> = {},
) {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const { error } = await supabase.from("audit_log").insert({
    actor_id: userData.user?.id ?? null,
    action,
    entity_type: entityType,
    entity_id: entityId,
    payload,
  });
  if (error) {
    // No bloquear la operación principal por fallo de auditoría.
    console.error("audit_log:", error.message);
  }
}
