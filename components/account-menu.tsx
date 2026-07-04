"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { signOut } from "@/app/login/actions";

export function AccountMenu({ username }: Readonly<{ username: string }>) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (
        menuRef.current &&
        event.target instanceof Node &&
        !menuRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isOpen]);

  return (
    <div className="relative ml-2" ref={menuRef}>
      <button
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="flex h-10 max-w-32 cursor-pointer items-center gap-2 truncate rounded-lg border border-muted-background bg-background px-3 text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:border-primary focus-visible:outline-none sm:max-w-48"
        onClick={() => setIsOpen((current) => !current)}
      >
        <span className="truncate">{username}</span>
        <span
          aria-hidden="true"
          className={`text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
        >
          v
        </span>
      </button>

      {isOpen ? (
        <div
          className="absolute right-0 top-12 z-20 w-44 overflow-hidden rounded-lg border border-muted-background bg-surface shadow-lg"
          role="menu"
        >
          <Link
            href="/settings/account"
            className="flex h-11 items-center px-4 text-foreground transition-colors hover:bg-muted-background hover:text-primary"
            onClick={() => setIsOpen(false)}
            role="menuitem"
          >
            Settings
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="flex h-11 w-full items-center px-4 text-left font-sans text-sm font-bold text-danger transition-colors hover:bg-danger/10"
              role="menuitem"
            >
              Sign out
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
