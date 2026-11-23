"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { deliverAccessLink, type Delivery } from "@/lib/admin/accessLinks";
import type { ActionState } from "@/lib/admin/actionState";
import { recordAudit } from "@/lib/admin/audit";
import { loadMember, requirePermission, type Member } from "@/lib/admin/auth";
import { getRole } from "@/lib/admin/data";
import {
  ALL_PERMISSIONS,
  canGrantAll,
  canManageMember,
  effectivePermissions,
  type Permission,
} from "@/lib/admin/permissions";
import { serviceClient } from "@/lib/supabase/service";

const NOT_ALLOWED = "You don't have permission to do that.";
const idSchema = z.uuid();

const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address.")),
  fullName: z.string().trim().min(1, "Enter a name.").max(100, "Name is too long."),
  roleId: z.uuid("Choose a role."),
});

function deliveryMessage(delivery: Delivery, sent: string): ActionState {
  if (delivery.delivered) return { message: sent };
  if (delivery.previewLink) {
    return { message: "Email dry-run is on, so nothing was sent. Share this link privately.", previewLink: delivery.previewLink };
  }
  return { error: "The email couldn't be sent. Check the Brevo settings, then use Resend access link." };
}

export async function inviteMemberAction(_: ActionState, form: FormData): Promise<ActionState> {
  const actor = await requirePermission("team.invite");
  const parsed = inviteSchema.safeParse({
    email: form.get("email"),
    fullName: form.get("fullName"),
    roleId: form.get("roleId"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  const { email, fullName, roleId } = parsed.data;

  const role = await getRole(roleId);
  if (!role) return { error: "That role no longer exists." };
  if ((role.isOwner && !actor.isOwner) || !canGrantAll(actor, role.permissions)) return { error: NOT_ALLOWED };

  const service = serviceClient();
  const { data, error } = await service.auth.admin.generateLink({ type: "invite", email });
  if (error || !data.user) {
    if (error?.code === "email_exists") return { error: "That email already has an account." };
    console.error("[team] invite failed", error?.message);
    return { error: "Couldn't create the invitation. Please try again." };
  }

  const { error: insertError } = await service.from("team_members").insert({
    user_id: data.user.id,
    email,
    full_name: fullName,
    role_id: role.id,
    invited_by: actor.id,
  });
  if (insertError) {
    await service.auth.admin.deleteUser(data.user.id);
    console.error("[team] member insert failed", insertError.message);
    return { error: "Couldn't add that member. Please try again." };
  }

  await recordAudit({
    actor,
    action: "team.member_invited",
    targetType: "member",
    targetId: data.user.id,
    details: { email, role: role.name },
  });
  const delivery = await deliverAccessLink({ email, fullName }, data.properties.hashed_token, "invite");
  revalidatePath("/admin/team");
  return deliveryMessage(delivery, `Invitation sent to ${email}.`);
}

async function loadManagedTarget(actor: Member, targetId: string): Promise<Member | null> {
  if (!idSchema.safeParse(targetId).success) return null;
  const target = await loadMember(targetId);
  return target && canManageMember(actor, target) ? target : null;
}

export async function updateMemberAction(targetId: string, _: ActionState, form: FormData): Promise<ActionState> {
  const actor = await requirePermission("team.manage");
  const target = await loadManagedTarget(actor, targetId);
  if (!target) return { error: NOT_ALLOWED };

  const role = await getRole(String(form.get("roleId") ?? ""));
  const status = form.get("status");
  if (!role || (status !== "active" && status !== "disabled")) return { error: "Check the form." };
  if (role.isOwner && !actor.isOwner) return { error: NOT_ALLOWED };

  const granted: Permission[] = [];
  const revoked: Permission[] = [];
  if (!role.isOwner) {
    for (const permission of ALL_PERMISSIONS) {
      const choice = form.get(`perm:${permission}`);
      if (choice === "allow") granted.push(permission);
      if (choice === "deny") revoked.push(permission);
    }
  }

  const next = effectivePermissions({ isOwner: role.isOwner, rolePermissions: role.permissions, granted, revoked });
  if (!canGrantAll(actor, next)) return { error: "You can't give access that you don't have yourself." };

  const { error } = await serviceClient()
    .from("team_members")
    .update({ role_id: role.id, status, granted_permissions: granted, revoked_permissions: revoked })
    .eq("user_id", target.id);
  if (error) {
    if (error.message.includes("LAST_OWNER")) return { error: "There must always be at least one active Owner." };
    console.error("[team] update failed", error.message);
    return { error: "Couldn't save the changes." };
  }

  await recordAudit({
    actor,
    action: "team.member_updated",
    targetType: "member",
    targetId: target.id,
    details: {
      email: target.email,
      role: { from: target.roleName, to: role.name },
      status: { from: target.status, to: status },
      granted,
      revoked,
    },
  });
  revalidatePath("/admin/team");
  revalidatePath(`/admin/team/${target.id}`);
  return { message: "Changes saved. They apply immediately." };
}

export async function resendAccessAction(targetId: string): Promise<ActionState> {
  const actor = await requirePermission("team.invite");
  const target = await loadManagedTarget(actor, targetId);
  if (!target) return { error: NOT_ALLOWED };
  if (target.status !== "active") return { error: "Enable this member first." };

  const { data, error } = await serviceClient().auth.admin.generateLink({ type: "recovery", email: target.email });
  if (error) {
    console.error("[team] access link failed", error.message);
    return { error: "Couldn't create a new link." };
  }
  await recordAudit({ actor, action: "team.access_link_sent", targetType: "member", targetId: target.id, details: { email: target.email } });
  const delivery = await deliverAccessLink(
    { email: target.email, fullName: target.fullName },
    data.properties.hashed_token,
    "recovery",
  );
  return deliveryMessage(delivery, `A new access link was sent to ${target.email}.`);
}

export async function removeMemberAction(targetId: string): Promise<ActionState> {
  const actor = await requirePermission("team.manage");
  const target = await loadManagedTarget(actor, targetId);
  if (!target) return { error: NOT_ALLOWED };

  const { error } = await serviceClient().auth.admin.deleteUser(target.id);
  if (error) {
    console.error("[team] remove failed", error.message);
    return { error: "Couldn't remove this member. An account must keep at least one active Owner." };
  }
  await recordAudit({
    actor,
    action: "team.member_removed",
    targetType: "member",
    targetId: target.id,
    details: { email: target.email, role: target.roleName },
  });
  revalidatePath("/admin/team");
  redirect("/admin/team");
}
