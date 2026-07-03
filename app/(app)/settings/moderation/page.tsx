import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ModerationSearch } from "./moderation-search";

const roleTitles = {
  moderator: "Moderator",
  admin: "Admin",
  developer: "Developer",
} as const;

export default async function ModerationPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  const user = data.user;

  if (error || !user?.id) {
    redirect("/login?next=/settings/moderation");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = profile?.role as keyof typeof roleTitles | undefined;
  const roleTitle = role ? roleTitles[role] : null;

  if (!roleTitle) {
    redirect("/settings/account");
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-heading text-4xl font-semibold text-foreground">
          {roleTitle}
        </h1>
      </div>

      <ModerationSearch />
    </div>
  );
}
