import Image from "next/image";
import Link from "next/link";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/demo", label: "Demo" },
];

export function Navbar() {
  return (
    <header className="border-b border-muted-background bg-surface">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link
          href="/"
          className="flex items-center"
          aria-label="Jingdex home"
        >
          <Image
            src="/logos/logo_rect.svg"
            alt="Jingdex"
            width={128}
            height={64}
            className="h-10 w-auto"
            priority
          />
        </Link>

        <div className="flex h-full items-center font-sans text-sm font-bold text-muted">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex h-full items-center px-3 transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
