"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionState } from "@/lib/admin/actionState";
import { recordAudit } from "@/lib/admin/audit";
import { requirePermission } from "@/lib/admin/auth";
import { getRole } from "@/lib/admin/data";
import { canGrantAll, onlyKnownPermissions } from "@/lib/admin/permissions";
import { serviceClient } from "@/lib/supabase/service";

const NOT_ALLOWED = "You can't change access that you don't have yourself.";

const roleSchema = z.object({
  name: z.string().trim().min(2, "Use at least 2 characters for the name.").max(50, "Name is too long."),
  description: z.string().trim().max(200, "Description is too long."),
});

export async function saveRoleAction(roleId: string | null, _: ActionState, form: FormData): Promise<ActionState> {
  const actor = await requirePermission("roles.manage");
  const parsed = roleSchema.safeParse({ name: form.get("name"), description: form.get("description") ?? "" });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form." };

  const permissions = onlyKnownPermissions(form.getAll("permissions").map(String));
  if (!canGrantAll(actor, permissions)) return { error: NOT_ALLOWED };

  const existing = roleId ? await getRole(roleId) : null;
  if (roleId && !existing) return { error: "That role no longer exists." };
  if (existing?.isOwner) return { error: "The Owner role can't be changed." };
  if (existing && !canGrantAll(actor, existing.permissions)) return { error: NOT_ALLOWED };

  const values = { ...parsed.data, permissions };
  const service = serviceClient();
  const result = existing
    ? await service.from("roles").update(values).eq("id", existing.id).select("id").single<{ id: string }>()
    : await service.from("roles").insert(values).select("id").single<{ id: string }>();
  if (result.error) {
    if (result.error.code === "23505") return { error: "A role with that name already exists." };
    console.error("[roles] save failed", result.error.message);
    return { error: "Couldn't save the role." };
  }

  await recordAudit({
    actor,
    action: existing ? "roles.updated" : "roles.created",
    targetType: "role",
    targetId: result.data.id,
    details: { name: parsed.data.name, permissions, previous: existing?.permissions },
  });
  revalidatePath("/admin/roles");
  revalidatePath("/admin/team");
  return { message: existing ? "Role saved. Changes apply immediately." : "Role created." };
}

export async function deleteRoleAction(roleId: string): Promise<ActionState> {
  const actor = await requirePermission("roles.manage");
  const role = await getRole(roleId);
  if (!role) return { error: "That role no longer exists." };
  if (role.isSystem) return { error: "The Owner role can't be deleted." };
  if (!canGrantAll(actor, role.permissions)) return { error: NOT_ALLOWED };

  const { error } = await serviceClient().from("roles").delete().eq("id", role.id);
  if (error) {
    if (error.code === "23503") return { error: "Move its members to another role first." };
    console.error("[roles] delete failed", error.message);
    return { error: "Couldn't delete the role." };
  }
  await recordAudit({ actor, action: "roles.deleted", targetType: "role", targetId: role.id, details: { name: role.name } });
  revalidatePath("/admin/roles");
  return { message: "Role deleted." };
}
