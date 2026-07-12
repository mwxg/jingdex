import Image from "next/image";
import Link from "next/link";
import { hasPermission } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { AccountMenu } from "./account-menu";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/dictionary/search", label: "Dictionary" },
  { href: "/community", label: "Community" },
  { href: "/demo", label: "Demo" },
];

export async function Navbar() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub ?? null;
  const { data: profile } = userId
    ? await supabase
        .from("profiles")
        .select("username,role")
        .eq("id", userId)
        .maybeSingle()
    : { data: null };

  return (
    <header className="border-b border-muted-background bg-surface">
      <nav className="mx-auto flex min-h-16 max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-3 sm:flex-nowrap sm:py-0">
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

        <div className="flex min-w-0 max-w-full items-center gap-1 font-sans text-sm font-bold text-muted">
          <div className="flex min-w-0 items-center gap-1 overflow-x-auto">
            {navLinks
              .filter(
                (link) =>
                  link.href !== "/demo" ||
                  hasPermission(profile?.role, "accessModerationPage"),
              )
              .map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex h-10 shrink-0 items-center px-3 transition-colors hover:text-primary"
                >
                  {link.label}
                </Link>
              ))}
          </div>
          {profile ? <AccountMenu username={profile.username} /> : null}
        </div>
      </nav>
    </header>
  );
}
