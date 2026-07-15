import { Suspense } from "react";
import { getAdministrativeRole, roleLabels } from "@/lib/auth/roles";
import { getViewer } from "@/lib/auth/viewer";
import { LoginRequired } from "@/components/login-required";
import { PageHeader } from "@/components/page-header";
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

export default async function SettingsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { userId } = await getViewer();

  if (!userId) {
    return (
      <main className="flex-1 bg-background text-foreground">
        <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:py-12">
          <PageHeader
            description="Manage your Jingdex account and learning preferences."
            eyebrow="Account"
            title="Settings"
          />
          <LoginRequired
            description="Log in to view and change your account settings."
            nextPath="/settings/account"
            title="Log in to view settings"
          />
        </div>
      </main>
    );
  }

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
