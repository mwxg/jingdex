"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AdministrativeRole } from "@/lib/auth/roles";

const roleTabClasses = {
  moderator: {
    active: "bg-moderator text-text-light hover:bg-moderator/90",
    inactive: "text-moderator hover:bg-moderator/10",
  },
  admin: {
    active: "bg-admin text-text-light hover:bg-admin/90",
    inactive: "text-admin hover:bg-admin/10",
  },
  developer: {
    active: "bg-developer text-text-light hover:bg-developer/90",
    inactive: "text-developer hover:bg-developer/10",
  },
} as const;

type SettingsNavProps = Readonly<{
  role?: AdministrativeRole;
  roleLabel?: string;
}>;

export function SettingsNav({ role, roleLabel }: SettingsNavProps) {
  const pathname = usePathname();
  const isAccountActive = pathname === "/settings/account";
  const isRoleActive = pathname?.startsWith("/settings/moderation") ?? false;

  return (
    <nav aria-label="Settings" className="space-y-2 font-sans text-sm font-bold">
      <Link
        href="/settings/account"
        aria-current={isAccountActive ? "page" : undefined}
        className={`block rounded-lg px-4 py-3 transition-colors ${
          isAccountActive
            ? "bg-primary text-text-light hover:bg-primary/90"
            : "text-muted hover:bg-muted-background hover:text-primary"
        }`}
      >
        Account settings
      </Link>
      {role && roleLabel ? (
        <Link
          href="/settings/moderation"
          aria-current={isRoleActive ? "page" : undefined}
          className={`block rounded-lg px-4 py-3 transition-colors ${
            isRoleActive
              ? roleTabClasses[role].active
              : roleTabClasses[role].inactive
          }`}
        >
          {roleLabel}
        </Link>
      ) : null}
    </nav>
  );
}
