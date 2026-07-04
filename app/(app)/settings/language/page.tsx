import { redirect } from "next/navigation";
import { normalizeLanguagePreferences } from "@/lib/preferences/language";
import { createClient } from "@/lib/supabase/server";
import { LanguageSettingsForm } from "./language-settings-form";

export default async function LanguageSettingsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  const user = data.user;

  if (error || !user?.id) {
    redirect("/login?next=/settings/language");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("preferred_character_set,preferred_pronunciation")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <LanguageSettingsForm preferences={normalizeLanguagePreferences(profile)} />
  );
}
