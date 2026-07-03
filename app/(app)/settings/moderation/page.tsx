import { redirect } from "next/navigation";
import {
  getAdministrativeRole,
  hasPermission,
  roleLabels,
} from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { getUserSearchPage } from "./actions";
import { ModerationSearch } from "./moderation-search";
import { TermManagement } from "./term-management";
import { TermSearch } from "./term-search";

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

  const role = getAdministrativeRole(profile?.role);
  const roleTitle = role ? roleLabels[role] : null;
  const canManageTerms = hasPermission(profile?.role, "manageTerms");

  if (!roleTitle) {
    redirect("/settings/account");
  }

  const initialSearchState = await getUserSearchPage();

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-heading text-4xl font-semibold text-foreground">
          {roleTitle}
        </h1>
      </div>

      <ModerationSearch initialState={initialSearchState} />

      <TermSearch canEditTerms={canManageTerms} />

      {canManageTerms ? <TermManagement /> : null}
    </div>
  );
}
