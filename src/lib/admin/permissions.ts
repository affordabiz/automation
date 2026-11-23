export const PERMISSION_GROUPS = [
  {
    feature: "Forms",
    permissions: [
      { key: "forms.view", label: "View forms" },
      { key: "forms.manage", label: "Create and edit forms" },
      { key: "forms.publish", label: "Publish forms" },
    ],
  },
  {
    feature: "Entries",
    permissions: [
      { key: "entries.view", label: "View entries" },
      { key: "entries.review", label: "Edit, publish and message clients" },
      { key: "entries.delete", label: "Delete entries" },
      { key: "settings.manage", label: "Turn auto-publish on or off" },
    ],
  },
  {
    feature: "Webpages",
    permissions: [
      { key: "webpages.view", label: "View webpages" },
      { key: "webpages.manage", label: "Suspend and restore webpages" },
    ],
  },
  {
    feature: "Automations",
    permissions: [
      { key: "automations.view", label: "View automations" },
      { key: "automations.manage", label: "Create and edit automations" },
    ],
  },
  {
    feature: "Team",
    permissions: [
      { key: "team.view", label: "View team members" },
      { key: "team.invite", label: "Invite team members" },
      { key: "team.manage", label: "Edit and remove team members" },
      { key: "roles.manage", label: "Create and edit roles" },
    ],
  },
  {
    feature: "Security",
    permissions: [{ key: "audit.view", label: "View the audit log" }],
  },
] as const;

export type Permission = (typeof PERMISSION_GROUPS)[number]["permissions"][number]["key"];

export const ALL_PERMISSIONS: readonly Permission[] = PERMISSION_GROUPS.flatMap((g) =>
  g.permissions.map((p) => p.key),
);

const KNOWN: ReadonlySet<string> = new Set(ALL_PERMISSIONS);

export function isPermission(value: string): value is Permission {
  return KNOWN.has(value);
}

export function onlyKnownPermissions(values: readonly string[]): Permission[] {
  return [...new Set(values.filter(isPermission))];
}

export interface AccessSubject {
  id: string;
  isOwner: boolean;
  permissions: readonly Permission[];
}

/** Owners always hold every permission. A revoke wins over a role or a grant. */
export function effectivePermissions(input: {
  isOwner: boolean;
  rolePermissions: readonly string[];
  granted: readonly string[];
  revoked: readonly string[];
}): Permission[] {
  if (input.isOwner) return [...ALL_PERMISSIONS];
  const revoked = new Set(input.revoked);
  return onlyKnownPermissions([...input.rolePermissions, ...input.granted]).filter((p) => !revoked.has(p));
}

export function hasPermission(subject: Pick<AccessSubject, "isOwner" | "permissions">, permission: Permission): boolean {
  return subject.isOwner || subject.permissions.includes(permission);
}

/** Nobody can hand out access they do not hold themselves. */
export function canGrantAll(actor: Pick<AccessSubject, "isOwner" | "permissions">, permissions: readonly Permission[]): boolean {
  return actor.isOwner || permissions.every((p) => actor.permissions.includes(p));
}

/** Members cannot change themselves, Owners, or anyone with more access than they have. */
export function canManageMember(actor: AccessSubject, target: AccessSubject): boolean {
  if (actor.id === target.id) return false;
  if (actor.isOwner) return true;
  if (target.isOwner) return false;
  return canGrantAll(actor, target.permissions);
}
