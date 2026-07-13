import { createClient } from "@/lib/supabase/server";
import { getAdministrativeRole, roleLabels } from "@/lib/auth/roles";
import { SidebarPageLayout } from "@/components/sidebar-page-layout";
import { SettingsNav } from "./settings-nav";

export default async function SettingsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
    <main className="flex-1 bg-background text-foreground">
      <SidebarPageLayout
        sidebar={
          <SettingsNav
            role={role ?? undefined}
            roleLabel={roleLabel ?? undefined}
          />
        }
      >
        {children}
      </SidebarPageLayout>
    </main>
  );
}
