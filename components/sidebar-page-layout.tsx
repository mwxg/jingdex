"use client";

import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

type SidebarPageLayoutProps = Readonly<{
  sidebar: React.ReactNode;
  children: React.ReactNode;
  mobileLabel?: string;
}>;

export function SidebarPageLayout({
  sidebar,
  children,
  mobileLabel = "Page sections",
}: SidebarPageLayoutProps) {
  const pathname = usePathname();
  const [openPathname, setOpenPathname] = useState<string | null>(null);
  const isOpen = openPathname === pathname;
  const sidebarId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenPathname(null);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <div className="mx-auto grid min-h-[calc(100dvh-4rem)] w-full max-w-[112rem] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[clamp(12rem,16vw,15rem)_minmax(0,1fr)] lg:gap-8 lg:px-8 lg:py-8">
      <aside className="min-w-0 lg:border-r lg:pr-6">
        <button
          aria-controls={sidebarId}
          aria-expanded={isOpen}
          className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-lg border border-muted-background bg-surface px-4 font-sans text-sm font-bold text-foreground transition-colors hover:border-primary hover:text-primary lg:hidden"
          onClick={() =>
            setOpenPathname((current) =>
              current === pathname ? null : pathname,
            )
          }
          ref={triggerRef}
          type="button"
        >
          <span className="flex items-center gap-3">
            <span aria-hidden="true" className="space-y-1">
              <span className="block h-0.5 w-4 bg-current" />
              <span className="block h-0.5 w-4 bg-current" />
              <span className="block h-0.5 w-4 bg-current" />
            </span>
            {mobileLabel}
          </span>
          <span
            aria-hidden="true"
            className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
          >
            v
          </span>
        </button>
        <div
          className={`${isOpen ? "mt-3 block border-b border-muted-background pb-6" : "hidden"} lg:mt-0 lg:block lg:border-b-0 lg:pb-0`}
          id={sidebarId}
          onClickCapture={(event) => {
            if (
              event.target instanceof Element &&
              event.target.closest("a")
            ) {
              setOpenPathname(null);
            }
          }}
        >
          {sidebar}
        </div>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
