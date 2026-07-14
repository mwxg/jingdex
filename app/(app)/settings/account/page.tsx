import { redirect } from "next/navigation";
import { getViewer } from "@/lib/auth/viewer";
import { AccountSettingsForm } from "./account-settings-form";

export default async function AccountSettingsPage() {
  const { email, profile, userId } = await getViewer();

  if (!userId || !email) {
    redirect("/login?next=/settings/account");
  }

  if (!profile) {
    redirect("/login?next=/settings/account");
  }

  return <AccountSettingsForm email={email} username={profile.username} />;
}
