import "server-only";
import { serviceClient } from "@/lib/supabase/service";
import { MEMBER_SELECT, toMember, type Member, type MemberRow } from "./auth";
import { ALL_PERMISSIONS, onlyKnownPermissions, type Permission } from "./permissions";

export interface Role {
  id: string;
  name: string;
  description: string;
  isOwner: boolean;
  isSystem: boolean;
  permissions: Permission[];
}

interface RoleRow {
  id: string;
  name: string;
  description: string;
  is_owner: boolean;
  is_system: boolean;
  permissions: string[];
}

const toRole = (r: RoleRow): Role => ({
  id: r.id,
  name: r.name,
  description: r.description,
  isOwner: r.is_owner,
  isSystem: r.is_system,
  permissions: r.is_owner ? [...ALL_PERMISSIONS] : onlyKnownPermissions(r.permissions),
});

export async function listRoles(): Promise<Role[]> {
  const { data, error } = await serviceClient()
    .from("roles")
    .select("id,name,description,is_owner,is_system,permissions")
    .order("is_owner", { ascending: false })
    .order("name");
  if (error) throw new Error(`Could not load roles: ${error.message}`);
  return (data as RoleRow[]).map(toRole);
}

export async function getRole(id: string): Promise<Role | null> {
  const { data, error } = await serviceClient()
    .from("roles")
    .select("id,name,description,is_owner,is_system,permissions")
    .eq("id", id)
    .maybeSingle<RoleRow>();
  if (error) return null;
  return data ? toRole(data) : null;
}

export async function listMembers(): Promise<Member[]> {
  const { data, error } = await serviceClient()
    .from("team_members")
    .select(MEMBER_SELECT)
    .order("created_at")
    .returns<MemberRow[]>();
  if (error) throw new Error(`Could not load team: ${error.message}`);
  return data.map(toMember);
}

export interface AuditEntry {
  id: number;
  actor_email: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

export async function listAudit(limit = 100): Promise<AuditEntry[]> {
  const { data, error } = await serviceClient()
    .from("audit_log")
    .select("id,actor_email,action,target_type,target_id,details,created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Could not load audit log: ${error.message}`);
  return data as AuditEntry[];
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(
    new Date(value),
  );
}
