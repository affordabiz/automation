import { describe, expect, it } from "vitest";
import {
  ALL_PERMISSIONS,
  canGrantAll,
  canManageMember,
  effectivePermissions,
  hasPermission,
  onlyKnownPermissions,
  type AccessSubject,
} from "./permissions";

const owner: AccessSubject = { id: "owner", isOwner: true, permissions: ALL_PERMISSIONS };
const manager: AccessSubject = { id: "manager", isOwner: false, permissions: ["team.manage", "entries.view", "entries.review"] };
const support: AccessSubject = { id: "support", isOwner: false, permissions: ["entries.view"] };

describe("effectivePermissions", () => {
  it("gives owners every permission regardless of overrides", () => {
    const result = effectivePermissions({ isOwner: true, rolePermissions: [], granted: [], revoked: ["team.view"] });
    expect(result).toEqual(ALL_PERMISSIONS);
  });

  it("combines role and granted permissions", () => {
    const result = effectivePermissions({ isOwner: false, rolePermissions: ["entries.view"], granted: ["forms.view"], revoked: [] });
    expect(result).toEqual(["entries.view", "forms.view"]);
  });

  it("lets a revoke win over the role and a grant", () => {
    const result = effectivePermissions({
      isOwner: false,
      rolePermissions: ["entries.view", "forms.view"],
      granted: ["forms.view"],
      revoked: ["forms.view"],
    });
    expect(result).toEqual(["entries.view"]);
  });

  it("ignores unknown permissions", () => {
    expect(onlyKnownPermissions(["entries.view", "made.up", "entries.view"])).toEqual(["entries.view"]);
  });
});

describe("access rules", () => {
  it("denies a permission the member does not hold", () => {
    expect(hasPermission(support, "entries.review")).toBe(false);
    expect(hasPermission(support, "entries.view")).toBe(true);
  });

  it("stops members granting access they do not have", () => {
    expect(canGrantAll(manager, ["entries.review"])).toBe(true);
    expect(canGrantAll(manager, ["roles.manage"])).toBe(false);
    expect(canGrantAll(owner, ["roles.manage"])).toBe(true);
  });

  it("stops members changing themselves", () => {
    expect(canManageMember(owner, owner)).toBe(false);
    expect(canManageMember(manager, manager)).toBe(false);
  });

  it("stops non-owners changing owners or more privileged members", () => {
    expect(canManageMember(manager, owner)).toBe(false);
    expect(canManageMember(support, manager)).toBe(false);
  });

  it("allows managing a member with equal or less access", () => {
    expect(canManageMember(manager, support)).toBe(true);
    expect(canManageMember(owner, manager)).toBe(true);
  });
});
