import { redirect } from "next/navigation";
import { normalizeLanguagePreferences } from "@/lib/preferences/language";
import { getViewer } from "@/lib/auth/viewer";
import { LanguageSettingsForm } from "./language-settings-form";

export default async function LanguageSettingsPage() {
  const { profile, userId } = await getViewer();

  if (!userId) {
    redirect("/login?next=/settings/language");
  }

  return (
    <LanguageSettingsForm preferences={normalizeLanguagePreferences(profile)} />
  );
}
