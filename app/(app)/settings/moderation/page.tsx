import { redirect } from "next/navigation";
import {
  type AppRole,
  getAdministrativeRole,
  hasPermission,
  roleLabels,
} from "@/lib/auth/roles";
import { getViewer } from "@/lib/auth/viewer";
import { normalizeLanguagePreferences } from "@/lib/preferences/language";
import { type UserSearchState } from "./actions";
import { CommunityDeckManagement } from "./community-deck-management";
import { ModerationSearch } from "./moderation-search";
import { TermManagement } from "./term-management";
import { TermSearch } from "./term-search";

export default async function ModerationPage() {
  const { profile, userId } = await getViewer();

  if (!userId) {
    redirect("/login?next=/settings/moderation");
  }
  const preferences = normalizeLanguagePreferences(profile);

  const role = getAdministrativeRole(profile?.role);
  const roleTitle = role ? roleLabels[role] : null;
  const canManageTerms = hasPermission(profile?.role, "manageTerms");
  const canManageCommunityDecks = hasPermission(
    profile?.role,
    "manageCommunityDecks",
  );

  if (!roleTitle) {
    redirect("/settings/account");
  }

  const initialSearchState: UserSearchState = {
    currentUserId: userId,
    currentUserRole: profile?.role as AppRole | undefined,
    page: 1,
    query: "",
    results: [],
    totalCount: 0,
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-heading text-4xl font-semibold text-foreground">
          {roleTitle}
        </h1>
      </div>

      <ModerationSearch initialState={initialSearchState} />

      <TermSearch canEditTerms={canManageTerms} preferences={preferences} />

      {canManageTerms ? <TermManagement /> : null}

      {canManageCommunityDecks ? (
        <CommunityDeckManagement preferences={preferences} />
      ) : null}
    </div>
  );
}
