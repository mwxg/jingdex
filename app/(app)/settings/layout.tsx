import { createClient } from "@/lib/supabase/server";
import { getAdministrativeRole, roleLabels } from "@/lib/auth/roles";
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
      <div className="mx-auto grid min-h-[calc(100dvh-4rem)] max-w-[88rem] gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:px-8">
        <aside className="border-b border-muted-background pb-4 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-6">
          <SettingsNav
            role={role ?? undefined}
            roleLabel={roleLabel ?? undefined}
          />
        </aside>

        <div className="min-w-0">{children}</div>
      </div>
    </main>
  );
}
