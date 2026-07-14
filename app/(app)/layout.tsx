import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { AppShell } from "@/components/app-shell";
import { AppSidebar } from "@/components/app-sidebar";
import { NavbarSkeleton, SidebarSkeleton } from "@/components/loading";
import { hasPermission } from "@/lib/auth/roles";
import { getViewer } from "@/lib/auth/viewer";

async function NavbarWithIdentity({
  identity,
}: Readonly<{ identity: ReturnType<typeof getViewer> }>) {
  const { profile, userId } = await identity;

  if (!userId || !profile) {
    redirect("/login");
  }

  return <Navbar profile={profile} />;
}

async function SidebarWithIdentity({
  identity,
}: Readonly<{ identity: ReturnType<typeof getViewer> }>) {
  const { profile, userId } = await identity;

  return (
    <AppSidebar
      canAccessDemo={hasPermission(profile?.role, "accessModerationPage")}
      canReview={hasPermission(profile?.role, "reviewTermSubmissions")}
      hasAccount={Boolean(userId)}
    />
  );
}

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const identity = getViewer();

  return (
    <>
      <Suspense fallback={<NavbarSkeleton />}>
        <NavbarWithIdentity identity={identity} />
      </Suspense>
      <AppShell
        sidebar={
          <Suspense fallback={<SidebarSkeleton />}>
            <SidebarWithIdentity identity={identity} />
          </Suspense>
        }
      >
        {children}
      </AppShell>
    </>
  );
}
