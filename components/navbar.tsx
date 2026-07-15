import Link from "next/link";
import { hasPermission } from "@/lib/auth/roles";
import { AccountMenu } from "./account-menu";
import { JingdexLogo } from "./jingdex-logo";
import { MobileNavbarMenu } from "./mobile-navbar-menu";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/dictionary/search", label: "Dictionary" },
  { href: "/community", label: "Community" },
  { href: "/my-stuff/decks", label: "My stuff" },
  { href: "/demo", label: "Demo" },
];

export function Navbar({
  profile,
}: Readonly<{
  profile: { role: string; username: string } | null;
}>) {
  const visibleLinks = navLinks.filter(
    (link) =>
      (link.href !== "/demo" ||
        hasPermission(profile?.role, "accessModerationPage")),
  );

  return (
    <header className="border-b border-muted-background bg-surface">
      <nav className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:py-0">
        <Link
          href="/"
          className="flex items-center"
          aria-label="Jingdex home"
        >
          <JingdexLogo className="h-10 w-auto" priority />
        </Link>

        <div className="hidden min-w-0 max-w-full items-center gap-1 font-sans text-sm font-bold text-muted lg:flex">
          <div className="flex min-w-0 items-center gap-1">
            {visibleLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex h-10 shrink-0 items-center px-3 transition-colors hover:text-primary"
                >
                  {link.label}
                </Link>
              ))}
          </div>
          {profile ? (
            <AccountMenu username={profile.username} />
          ) : (
            <Link
              className="ml-2 flex h-10 items-center rounded-lg border border-muted-background bg-background px-3 text-foreground transition-colors hover:border-primary hover:text-primary"
              href="/login"
            >
              Log in/Sign up
            </Link>
          )}
        </div>

        <MobileNavbarMenu
          links={visibleLinks}
          username={profile?.username}
        />
      </nav>
    </header>
  );
}
