"use client";

import { FileText, Globe, Inbox, LayoutDashboard, ScrollText, ShieldCheck, Users, Workflow } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { hasPermission, type Permission } from "@/lib/admin/permissions";

const ITEMS: { label: string; href?: string; icon: typeof Users; permission?: Permission }[] = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "Forms", href: "/admin/forms", icon: FileText, permission: "forms.view" },
  { label: "Entries", href: "/admin/entries", icon: Inbox, permission: "entries.view" },
  { label: "Webpages", href: "/admin/webpages", icon: Globe, permission: "webpages.view" },
  { label: "Automations", icon: Workflow, permission: "automations.view" },
  { label: "Team", href: "/admin/team", icon: Users, permission: "team.view" },
  { label: "Roles", href: "/admin/roles", icon: ShieldCheck, permission: "roles.manage" },
  { label: "Audit log", href: "/admin/audit", icon: ScrollText, permission: "audit.view" },
];

export function AdminNav({ isOwner, permissions }: { isOwner: boolean; permissions: Permission[] }) {
  const pathname = usePathname();
  const visible = ITEMS.filter((i) => !i.permission || hasPermission({ isOwner, permissions }, i.permission));

  return (
    <nav aria-label="Admin" className="flex gap-1 overflow-x-auto lg:flex-col">
      {visible.map(({ label, href, icon: Icon }) => {
        const content = (
          <>
            <Icon className="size-4 shrink-0" aria-hidden />
            <span>{label}</span>
          </>
        );
        const base = "flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium";
        if (!href) {
          return (
            <span key={label} className={`${base} cursor-not-allowed text-teal-100/50`} title="Coming soon">
              {content}
              <span className="ml-auto rounded bg-white/10 px-1.5 py-0.5 text-[10px] uppercase">Soon</span>
            </span>
          );
        }
        const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={label}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`${base} ${active ? "bg-white/15 text-white" : "text-teal-50 hover:bg-white/10"}`}
          >
            {content}
          </Link>
        );
      })}
    </nav>
  );
}
