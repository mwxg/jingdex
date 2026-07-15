import { normalizeLanguagePreferences } from "@/lib/preferences/language";
import { getViewer } from "@/lib/auth/viewer";
import { LanguageSettingsForm } from "./language-settings-form";

export default async function LanguageSettingsPage() {
  const { profile, userId } = await getViewer();

  if (!userId) {
    return null;
  }

  return (
    <LanguageSettingsForm preferences={normalizeLanguagePreferences(profile)} />
  );
}
