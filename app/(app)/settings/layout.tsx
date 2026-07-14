import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getAdministrativeRole, roleLabels } from "@/lib/auth/roles";
import { SidebarSkeleton } from "@/components/loading";
import { SidebarPageLayout } from "@/components/sidebar-page-layout";
import { SettingsNav } from "./settings-nav";

async function SettingsSidebar() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub ?? null;
  const { data: profile } = userId
    ? await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle()
    : { data: null };
  const role = getAdministrativeRole(profile?.role);
  const roleLabel = role ? roleLabels[role] : null;

  return (
    <SettingsNav
      role={role ?? undefined}
      roleLabel={roleLabel ?? undefined}
    />
  );
}

export default function SettingsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="flex-1 bg-background text-foreground">
      <SidebarPageLayout
        sidebar={
          <Suspense fallback={<SidebarSkeleton />}>
            <SettingsSidebar />
          </Suspense>
        }
      >
        {children}
      </SidebarPageLayout>
    </main>
  );
}
