"use client";

import { usePathname } from "next/navigation";
import { SidebarPageLayout } from "./sidebar-page-layout";

type AppShellProps = Readonly<{
  children: React.ReactNode;
  sidebar: React.ReactNode;
}>;

const sidebarSections = ["/dictionary", "/community", "/my-stuff", "/demo"];

export function AppShell({ children, sidebar }: AppShellProps) {
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
    <SidebarPageLayout
      sidebar={sidebar}
    >
      {content}
    </SidebarPageLayout>
  );
}
