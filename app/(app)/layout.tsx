import { Suspense } from "react";
import { Navbar } from "@/components/navbar";
import { AppShell } from "@/components/app-shell";
import { AppSidebar } from "@/components/app-sidebar";
import { NavbarSkeleton, SidebarSkeleton } from "@/components/loading";
import { hasPermission } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

type AppIdentity = {
  profile: { role: string; username: string } | null;
  userId: string | null;
};

async function getAppIdentity(): Promise<AppIdentity> {
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

  return { profile, userId };
}

async function NavbarWithIdentity({
  identity,
}: Readonly<{ identity: Promise<AppIdentity> }>) {
  const { profile } = await identity;
  return <Navbar profile={profile} />;
}

async function SidebarWithIdentity({
  identity,
}: Readonly<{ identity: Promise<AppIdentity> }>) {
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
  const identity = getAppIdentity();

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
