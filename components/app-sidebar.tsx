"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type AppSidebarProps = Readonly<{
  hasAccount: boolean;
  canAccessDemo: boolean;
}>;

type SidebarSection = Readonly<{
  label: string;
  requiresAccount?: boolean;
  requiresDemoAccess?: boolean;
  links: readonly Readonly<{
    href: string;
    label: string;
    exact?: boolean;
  }>[];
}>;

const sections: readonly SidebarSection[] = [
  {
    label: "Dictionary",
    links: [
      { href: "/dictionary/search", label: "Search dictionary" },
      { href: "/dictionary/contribute", label: "Contribute words" },
    ],
  },
  {
    label: "Community",
    links: [
      { href: "/community", label: "Browse decks", exact: true },
      { href: "/community/jingdex", label: "Decks by Jingdex" },
    ],
  },
  {
    label: "My stuff",
    requiresAccount: true,
    links: [
      { href: "/my-stuff/decks", label: "My decks" },
      { href: "/my-stuff/contributions", label: "My contributions" },
    ],
  },
  {
    label: "Reference",
    requiresDemoAccess: true,
    links: [{ href: "/demo", label: "Interface demo" }],
  },
];

export function AppSidebar({ hasAccount, canAccessDemo }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <nav aria-label="App sections" className="space-y-6 font-sans text-sm">
      {sections.map((section) => {
        if (section.requiresAccount && !hasAccount) return null;
        if (section.requiresDemoAccess && !canAccessDemo) return null;

        return (
          <section aria-labelledby={`sidebar-${section.label.toLowerCase().replace(" ", "-")}`} key={section.label}>
            <h2
              className="mb-2 px-4 text-xs font-bold uppercase tracking-wider text-muted"
              id={`sidebar-${section.label.toLowerCase().replace(" ", "-")}`}
            >
              {section.label}
            </h2>
            <ul className="space-y-1">
              {section.links.map((link) => {
                const active =
                  link.exact
                    ? pathname === link.href ||
                      (pathname.startsWith("/community/") &&
                        !pathname.startsWith("/community/jingdex"))
                    : pathname === link.href || pathname.startsWith(`${link.href}/`);

                return (
                  <li key={link.href}>
                    <Link
                      aria-current={active ? "page" : undefined}
                      className={`block rounded-lg px-4 py-3 font-bold transition-colors ${
                        active
                          ? "bg-primary text-text-light hover:bg-primary/90"
                          : "text-muted hover:bg-muted-background hover:text-primary"
                      }`}
                      href={link.href}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </nav>
  );
}
