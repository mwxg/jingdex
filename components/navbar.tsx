import Image from "next/image";
import Link from "next/link";
import { signOut } from "@/app/login/actions";
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
            <>
              <span className="hidden px-3 text-foreground sm:inline">
                {profile.username}
              </span>
              <form action={signOut}>
                <button
                  type="submit"
                  className="h-10 rounded-lg px-3 transition-colors hover:bg-muted-background hover:text-primary"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : null}
        </div>
      </nav>
    </header>
  );
}
