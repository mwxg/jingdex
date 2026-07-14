"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { signOut } from "@/app/login/actions";

type MobileNavbarMenuProps = Readonly<{
  links: readonly Readonly<{ href: string; label: string }>[];
  username?: string;
}>;

export function MobileNavbarMenu({ links, username }: MobileNavbarMenuProps) {
  const pathname = usePathname();
  const [openPathname, setOpenPathname] = useState<string | null>(null);
  const isOpen = openPathname === pathname;
  const panelId = useId();
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (
        menuRef.current &&
        event.target instanceof Node &&
        !menuRef.current.contains(event.target)
      ) {
        setOpenPathname(null);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenPathname(null);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="relative lg:hidden" ref={menuRef}>
      <button
        aria-controls={panelId}
        aria-expanded={isOpen}
        aria-label={isOpen ? "Close navigation" : "Open navigation"}
        className={`grid size-11 cursor-pointer place-items-center rounded-lg border transition-colors ${
          isOpen
            ? "border-primary bg-primary text-on-primary hover:bg-primary/90"
            : "border-muted-background bg-background text-foreground hover:border-primary hover:text-primary"
        }`}
        onClick={() =>
          setOpenPathname((current) =>
            current === pathname ? null : pathname,
          )
        }
        ref={triggerRef}
        type="button"
      >
        <span aria-hidden="true" className="space-y-1.5">
          <span className={`block h-0.5 w-5 bg-current transition-transform ${isOpen ? "translate-y-2 rotate-45" : ""}`} />
          <span className={`block h-0.5 w-5 bg-current transition-opacity ${isOpen ? "opacity-0" : ""}`} />
          <span className={`block h-0.5 w-5 bg-current transition-transform ${isOpen ? "-translate-y-2 -rotate-45" : ""}`} />
        </span>
      </button>

      {isOpen ? (
        <div
          className="absolute right-0 top-13 z-30 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-muted-background bg-surface p-2 font-sans text-sm font-bold shadow-lg"
          id={panelId}
        >
          <nav aria-label="Primary navigation">
            <ul className="space-y-1">
              {links.map((link) => {
                const isActive =
                  pathname === link.href ||
                  (link.href !== "/" && pathname.startsWith(`${link.href}/`));

                return (
                  <li key={link.href}>
                    <Link
                      aria-current={isActive ? "page" : undefined}
                      className={`flex min-h-11 items-center rounded-lg px-4 transition-colors ${isActive ? "bg-primary text-on-primary" : "text-muted hover:bg-muted-background hover:text-primary"}`}
                      href={link.href}
                      onClick={() => setOpenPathname(null)}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {username ? (
            <div className="mt-2 border-t border-muted-background pt-2">
              <p className="truncate px-4 py-2 text-xs text-muted">
                Signed in as {username}
              </p>
              <Link
                className="flex min-h-11 items-center rounded-lg px-4 text-foreground transition-colors hover:bg-muted-background hover:text-primary"
                href="/settings/account"
                onClick={() => setOpenPathname(null)}
              >
                Settings
              </Link>
              <form action={signOut}>
                <button
                  className="flex min-h-11 w-full cursor-pointer items-center rounded-lg px-4 text-left text-danger transition-colors hover:bg-danger/10"
                  type="submit"
                >
                  Sign out
                </button>
              </form>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
