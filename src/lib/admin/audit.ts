import "server-only";
import { serviceClient } from "@/lib/supabase/service";

export async function recordAudit(entry: {
  actor: { id: string; email: string } | null;
  action: string;
  targetType?: string;
  targetId?: string;
  details?: Record<string, unknown>;
}): Promise<void> {
  const { error } = await serviceClient().from("audit_log").insert({
    actor_id: entry.actor?.id ?? null,
    actor_email: entry.actor?.email ?? null,
    action: entry.action,
    target_type: entry.targetType ?? null,
    target_id: entry.targetId ?? null,
    details: entry.details ?? {},
  });
  if (error) console.error("[audit] failed to record", entry.action, error.message);
}
