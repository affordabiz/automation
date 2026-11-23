import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSessionClient } from "@/lib/supabase/server";
import { serviceClient } from "@/lib/supabase/service";
import { effectivePermissions, hasPermission, type AccessSubject, type Permission } from "./permissions";

export interface Member extends AccessSubject {
  email: string;
  fullName: string;
  roleId: string;
  roleName: string;
  status: "active" | "disabled";
  granted: string[];
  revoked: string[];
  createdAt: string;
}

export interface MemberRow {
  user_id: string;
  email: string;
  full_name: string;
  role_id: string;
  granted_permissions: string[];
  revoked_permissions: string[];
  status: "active" | "disabled";
  created_at: string;
  roles: { name: string; is_owner: boolean; permissions: string[] };
}

export const MEMBER_SELECT =
  "user_id,email,full_name,role_id,granted_permissions,revoked_permissions,status,created_at,roles!inner(name,is_owner,permissions)";

export function toMember(row: MemberRow): Member {
  return {
    id: row.user_id,
    email: row.email,
    fullName: row.full_name,
    roleId: row.role_id,
    roleName: row.roles.name,
    isOwner: row.roles.is_owner,
    status: row.status,
    granted: row.granted_permissions,
    revoked: row.revoked_permissions,
    createdAt: row.created_at,
    permissions: effectivePermissions({
      isOwner: row.roles.is_owner,
      rolePermissions: row.roles.permissions,
      granted: row.granted_permissions,
      revoked: row.revoked_permissions,
    }),
  };
}

export async function loadMember(userId: string): Promise<Member | null> {
  const { data, error } = await serviceClient()
    .from("team_members")
    .select(MEMBER_SELECT)
    .eq("user_id", userId)
    .maybeSingle<MemberRow>();
  if (error) throw new Error(`Could not load team member: ${error.message}`);
  return data ? toMember(data) : null;
}

export type AccessState =
  | { state: "signed-out" }
  | { state: "denied" }
  | { state: "ready"; member: Member };

/** Verifies the session and reloads access on every request, so changes apply immediately. */
export const getAccess = cache(async (): Promise<AccessState> => {
  await connection(); // Access must never be decided at build time.
  if (!isSupabaseConfigured()) return { state: "signed-out" };
  const supabase = await createSessionClient();
  // Verifies the signed token locally. The team_members check below still applies removals immediately.
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) return { state: "signed-out" };

  const member = await loadMember(userId);
  if (!member || member.status !== "active") return { state: "denied" };
  return { state: "ready", member };
});

/** Call at the top of every admin page and Server Action. */
export async function requireMember(): Promise<Member> {
  const access = await getAccess();
  if (access.state === "signed-out") redirect("/admin/login");
  if (access.state === "denied") redirect("/admin/login?error=access");
  return access.member;
}

export async function requirePermission(permission: Permission): Promise<Member> {
  const member = await requireMember();
  if (!hasPermission(member, permission)) redirect("/admin?denied=1");
  return member;
}
