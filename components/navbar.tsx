import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/demo", label: "Demo" },
];

export async function Navbar() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub ?? null;
  const { data: profile } = userId
    ? await supabase
        .from("profiles")
        .select("username")
        .eq("id", userId)
        .maybeSingle()
    : { data: null };

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

        <div className="flex h-full items-center gap-1 font-sans text-sm font-bold text-muted">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex h-full items-center px-3 transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
          {profile ? (
            <Link
              href="/settings/account"
              className="ml-2 flex h-10 max-w-32 items-center truncate rounded-lg border border-muted-background bg-background px-3 text-foreground transition-colors hover:border-primary hover:text-primary sm:max-w-48"
            >
              {profile.username}
            </Link>
          ) : null}
        </div>
      </nav>
    </header>
  );
}
