import { Navbar } from "@/components/navbar";
import { AppShell } from "@/components/app-shell";
import { hasPermission } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub ?? null;
  const { data: profile } = userId
    ? await supabase.from("profiles").select("role").eq("id", userId).maybeSingle()
    : { data: null };

  return (
    <>
      <Navbar />
      <AppShell
        canAccessDemo={hasPermission(profile?.role, "accessModerationPage")}
        hasAccount={Boolean(userId)}
      >
        {children}
      </AppShell>
    </>
  );
}
