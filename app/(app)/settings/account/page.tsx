import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AccountSettingsForm } from "./account-settings-form";

export default async function AccountSettingsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  const user = data.user;

  if (error || !user?.id || !user.email) {
    redirect("/login?next=/settings/account");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    redirect("/login?next=/settings/account");
  }

  return <AccountSettingsForm email={user.email} username={profile.username} />;
}
