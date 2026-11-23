import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { loadMember, requirePermission } from "@/lib/admin/auth";
import { listRoles } from "@/lib/admin/data";
import { canGrantAll, canManageMember, hasPermission, PERMISSION_GROUPS, type Permission } from "@/lib/admin/permissions";
import { removeMemberAction, resendAccessAction, updateMemberAction } from "../actions";
import { MemberEditor, MemberSecurity } from "./MemberEditor";

export const metadata: Metadata = { title: "Team member" };

export default async function MemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await requirePermission("team.view");
  if (!z.uuid().safeParse(id).success) notFound();
  const member = await loadMember(id);
  if (!member) notFound();

  const manageable = canManageMember(actor, member);
  const canEdit = manageable && hasPermission(actor, "team.manage");
  const canResend = manageable && hasPermission(actor, "team.invite");
  const roles = canEdit
    ? (await listRoles())
        .filter((r) => r.id === member.roleId || ((actor.isOwner || !r.isOwner) && canGrantAll(actor, r.permissions)))
        .map((r) => ({ id: r.id, name: r.name, isOwner: r.isOwner, permissions: r.permissions }))
    : [];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/admin/team" className="text-sm font-medium text-teal-800 hover:underline">← Back to team</Link>
      <header>
        <h1 className="text-2xl font-bold tracking-tight">{member.fullName}</h1>
        <p className="mt-1 text-sm text-slate-600">{member.email} · {member.roleName}</p>
      </header>

      {canEdit ? (
        <MemberEditor
          key={`${member.roleId}:${member.status}`}
          roles={roles}
          roleId={member.roleId}
          status={member.status}
          granted={member.granted}
          revoked={member.revoked}
          save={updateMemberAction.bind(null, member.id)}
        />
      ) : (
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold">Access</h2>
          {actor.id === member.id ? <p className="mt-1 text-sm text-slate-600">You can&apos;t change your own access.</p> : null}
          <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            {PERMISSION_GROUPS.flatMap<{ key: Permission; label: string }>((g) => [...g.permissions])
              .filter((p) => member.permissions.includes(p.key))
              .map((p) => (
                <li key={p.key}>{p.label}</li>
              ))}
          </ul>
        </section>
      )}

      {canEdit || canResend ? (
        <MemberSecurity
          resend={canResend ? resendAccessAction.bind(null, member.id) : undefined}
          remove={canEdit ? removeMemberAction.bind(null, member.id) : undefined}
        />
      ) : null}
    </div>
  );
}
