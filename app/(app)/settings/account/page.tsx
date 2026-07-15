import { getViewer } from "@/lib/auth/viewer";
import { AccountSettingsForm } from "./account-settings-form";

export default async function AccountSettingsPage() {
  const { email, profile, userId } = await getViewer();

  if (!userId || !email) {
    return null;
  }

  if (!profile) {
    return null;
  }

  return (
    <AccountSettingsForm
      email={email}
      isProfilePublic={profile.is_public}
      username={profile.username}
    />
  );
}
