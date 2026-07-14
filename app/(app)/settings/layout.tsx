import { Suspense } from "react";
import { getAdministrativeRole, roleLabels } from "@/lib/auth/roles";
import { getViewer } from "@/lib/auth/viewer";
import { SidebarSkeleton } from "@/components/loading";
import { SidebarPageLayout } from "@/components/sidebar-page-layout";
import { SettingsNav } from "./settings-nav";

async function SettingsSidebar() {
  const { profile } = await getViewer();
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
        mobileLabel="Settings sections"
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
