"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { deliverAccessLink } from "@/lib/admin/accessLinks";
import type { ActionState } from "@/lib/admin/actionState";
import { recordAudit } from "@/lib/admin/audit";
import { loadMember } from "@/lib/admin/auth";
import { clientIp, rateLimit } from "@/lib/rateLimit";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSessionClient } from "@/lib/supabase/server";
import { serviceClient } from "@/lib/supabase/service";

const NOT_CONFIGURED = "Login isn't configured yet. Add the Supabase keys to the environment.";
const INVALID_LOGIN = "Incorrect email or password.";
const TOO_MANY = "Too many attempts. Please wait and try again.";
const WINDOW = 15 * 60 * 1000;

const emailSchema = z.string().trim().toLowerCase().pipe(z.email());

async function allow(scope: string, limit: number): Promise<boolean> {
  return rateLimit(`admin-${scope}:${clientIp(await headers())}`, limit, WINDOW);
}

export async function loginAction(_: ActionState, form: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED };
  if (!(await allow("login", 10))) return { error: TOO_MANY };

  const email = emailSchema.safeParse(form.get("email"));
  const password = String(form.get("password") ?? "");
  if (!email.success || !password) return { error: INVALID_LOGIN };

  const supabase = await createSessionClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.data, password });
  if (error || !data.user) return { error: INVALID_LOGIN };

  const member = await loadMember(data.user.id);
  if (!member || member.status !== "active") {
    await supabase.auth.signOut();
    return { error: INVALID_LOGIN };
  }
  await recordAudit({
    actor: { id: member.id, email: member.email },
    action: "auth.login",
    targetType: "member",
    targetId: member.id,
  });
  redirect("/admin");
}

export async function forgotPasswordAction(_: ActionState, form: FormData): Promise<ActionState> {
  const done = { message: "If that email belongs to a team member, a reset link is on its way." };
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED };
  if (!(await allow("forgot", 5))) return { error: TOO_MANY };

  const email = emailSchema.safeParse(form.get("email"));
  if (!email.success) return done;

  const service = serviceClient();
  const { data: row } = await service
    .from("team_members")
    .select("user_id,full_name,status")
    .ilike("email", email.data.replace(/[\\%_]/g, "\\$&"))
    .maybeSingle<{ user_id: string; full_name: string; status: string }>();
  if (!row || row.status !== "active") return done;

  const { data, error } = await service.auth.admin.generateLink({ type: "recovery", email: email.data });
  if (error) {
    console.error("[admin] recovery link failed", error.message);
    return done;
  }
  const delivery = await deliverAccessLink(
    { email: email.data, fullName: row.full_name },
    data.properties.hashed_token,
    "recovery",
  );
  await recordAudit({
    actor: null,
    action: "auth.password_reset_requested",
    targetType: "member",
    targetId: row.user_id,
  });
  return delivery.previewLink ? { ...done, previewLink: delivery.previewLink } : done;
}

const setPasswordSchema = z.object({
  token_hash: z.string().min(10),
  type: z.enum(["invite", "recovery"]),
  password: z.string().min(12, "Use at least 12 characters.").max(72, "Use 72 characters or fewer."),
});

export async function setPasswordAction(_: ActionState, form: FormData): Promise<ActionState> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED };
  if (!(await allow("set-password", 10))) return { error: TOO_MANY };

  const parsed = setPasswordSchema.safeParse({
    token_hash: form.get("token_hash"),
    type: form.get("type"),
    password: form.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid request." };
  if (parsed.data.password !== form.get("confirm")) return { error: "Passwords don't match." };

  const supabase = await createSessionClient();
  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: parsed.data.token_hash,
    type: parsed.data.type,
  });
  if (error || !data.user) return { error: "This link is invalid or has expired. Ask for a new one." };

  const member = await loadMember(data.user.id);
  if (!member || member.status !== "active") {
    await supabase.auth.signOut();
    return { error: "This account doesn't have admin access." };
  }

  const { error: updateError } = await serviceClient().auth.admin.updateUserById(data.user.id, {
    password: parsed.data.password,
  });
  if (updateError) {
    await supabase.auth.signOut();
    return { error: "Couldn't set that password. Choose a different one and request a new link." };
  }
  await supabase.auth.signOut({ scope: "others" });
  await recordAudit({
    actor: { id: member.id, email: member.email },
    action: parsed.data.type === "invite" ? "auth.invite_accepted" : "auth.password_reset",
    targetType: "member",
    targetId: member.id,
  });
  redirect("/admin");
}

export async function signOutAction(): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = await createSessionClient();
    await supabase.auth.signOut();
  }
  redirect("/admin/login");
}
