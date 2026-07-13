"use client";

import { usePathname } from "next/navigation";
import { AppSidebar } from "./app-sidebar";

type AppShellProps = Readonly<{
  children: React.ReactNode;
  hasAccount: boolean;
  canAccessDemo: boolean;
}>;

const sidebarSections = ["/dictionary", "/community", "/my-stuff", "/demo"];

export function AppShell({ children, hasAccount, canAccessDemo }: AppShellProps) {
  const pathname = usePathname();
  const hasSidebar = sidebarSections.some(
    (section) => pathname === section || pathname.startsWith(`${section}/`),
  );

  if (!hasSidebar) return children;

  const content =
    pathname.startsWith("/dictionary") || pathname.startsWith("/my-stuff") ? (
      <main className="min-w-0 bg-background text-foreground">{children}</main>
    ) : (
      <div className="min-w-0">{children}</div>
    );

  return (
    <div className="mx-auto grid min-h-[calc(100dvh-4rem)] max-w-352 gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:px-8">
      <aside className="border-b border-muted-background pb-6 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-6">
        <AppSidebar hasAccount={hasAccount} canAccessDemo={canAccessDemo} />
      </aside>
      {content}
    </div>
  );
}
