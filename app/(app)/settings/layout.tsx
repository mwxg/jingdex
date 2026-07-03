import { createClient } from "@/lib/supabase/server";
import { SettingsNav } from "./settings-nav";

const roleLabels = {
  moderator: "Moderator",
  admin: "Admin",
  developer: "Developer",
} as const;

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
  const role = profile?.role as keyof typeof roleLabels | undefined;
  const roleLabel = role ? roleLabels[role] : null;

  return (
    <main className="flex-1 bg-background text-foreground">
      <div className="mx-auto grid min-h-[calc(100dvh-4rem)] max-w-6xl gap-8 px-6 py-8 md:grid-cols-[15rem_1fr]">
        <aside className="border-b border-muted-background pb-4 md:border-b-0 md:border-r md:pb-0 md:pr-6">
          <SettingsNav role={role} roleLabel={roleLabel ?? undefined} />
        </aside>

        <div>{children}</div>
      </div>
    </main>
  );
}
