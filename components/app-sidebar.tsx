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
    links: [{ href: "/community", label: "Browse decks" }],
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
    <nav aria-label="App sections" className="font-sans text-sm">
      {sections.map((section) => {
        if (section.requiresAccount && !hasAccount) return null;
        if (section.requiresDemoAccess && !canAccessDemo) return null;

        return (
          <section
            aria-labelledby={`sidebar-${section.label.toLowerCase().replace(" ", "-")}`}
            className="border-b border-muted-background py-5 first:pt-0 last:border-b-0 last:pb-0"
            key={section.label}
          >
            <h2
              className="mb-2 flex items-center gap-2 px-4 text-xs font-bold uppercase tracking-wider text-foreground"
              id={`sidebar-${section.label.toLowerCase().replace(" ", "-")}`}
            >
              <span aria-hidden="true" className="h-3 w-1 rounded-full bg-accent" />
              {section.label}
            </h2>
            <ul className="space-y-1">
              {section.links.map((link) => {
                const active =
                  pathname === link.href || pathname.startsWith(`${link.href}/`);

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
