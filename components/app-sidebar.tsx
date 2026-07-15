"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type AppSidebarProps = Readonly<{
  canAccessDemo: boolean;
  canReview: boolean;
}>;

type SidebarSection = Readonly<{
  label: string;
  requiresDemoAccess?: boolean;
  links: readonly Readonly<{
    href: string;
    label: string;
    special?: boolean;
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
      { href: "/community/featured", label: "Featured" },
      { href: "/community/browse", label: "Browse decks" },
      { href: "/community/review", label: "Review", special: true },
    ],
  },
  {
    label: "My stuff",
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

export function AppSidebar({ canAccessDemo, canReview }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <nav aria-label="App sections" className="font-sans text-sm">
      {sections.map((section) => {
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
                if (link.special && !canReview) return null;
                const isCommunityDeck = /^\/community\/[^/]+$/.test(pathname)
                  && !["/community/featured", "/community/browse", "/community/jingdex", "/community/review"].includes(pathname);
                const active = pathname === link.href
                  || pathname.startsWith(`${link.href}/`)
                  || (link.href === "/community/featured" && pathname === "/community/jingdex")
                  || (link.href === "/community/browse" && isCommunityDeck);

                return (
                  <li key={link.href}>
                    <Link
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center justify-between gap-3 rounded-lg px-4 py-3 font-bold transition-colors ${
                        active
                          ? link.special
                            ? "bg-admin text-on-role hover:bg-admin/90"
                            : "bg-primary text-on-primary hover:bg-primary/90"
                          : link.special
                            ? "border border-admin/30 bg-admin/10 text-admin hover:bg-admin/20"
                            : "text-muted hover:bg-muted-background hover:text-primary"
                      }`}
                      href={link.href}
                    >
                      <span>{link.label}</span>
                      {link.special ? (
                        <span className={`rounded-full px-2 py-0.5 text-[0.65rem] uppercase tracking-wide ${active ? "bg-text-light/20" : "bg-admin/15"}`}>
                          Admin
                        </span>
                      ) : null}
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
