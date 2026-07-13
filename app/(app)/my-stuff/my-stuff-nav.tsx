"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/my-stuff/decks", label: "My Decks" },
  { href: "/my-stuff/contributions", label: "My Contributions" },
];

export function MyStuffNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="My stuff" className="space-y-2 font-sans text-sm font-bold">
      {links.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={`block rounded-lg px-4 py-3 transition-colors ${
              active
                ? "bg-primary text-text-light hover:bg-primary/90"
                : "text-muted hover:bg-muted-background hover:text-primary"
            }`}
            href={link.href}
            key={link.href}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
