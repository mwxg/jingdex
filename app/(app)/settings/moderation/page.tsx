import { redirect } from "next/navigation";
import {
  type AppRole,
  getAdministrativeRole,
  hasPermission,
  roleLabels,
} from "@/lib/auth/roles";
import { getViewer } from "@/lib/auth/viewer";
import { normalizeLanguagePreferences } from "@/lib/preferences/language";
import { createClient } from "@/lib/supabase/server";
import type { TagDefinition, TagStyle } from "@/lib/tags";
import { type TagCatalogState, type UserSearchState } from "./actions";
import { CommunityDeckManagement } from "./community-deck-management";
import { ModerationSearch } from "./moderation-search";
import { TermManagement } from "./term-management";
import { TermSearch } from "./term-search";
import { TagCatalogManagement } from "./tag-catalog-management";

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
  const canManageUserTags = hasPermission(profile?.role, "manageUserTags");

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
  let initialTagCatalogState: TagCatalogState | null = null;
  if (canManageUserTags) {
    const supabase = await createClient();
    const [tagsResult, stylesResult] = await Promise.all([
      supabase.rpc("get_tag_catalog_for_management"),
      supabase.rpc("get_tag_styles_for_management"),
    ]);
    initialTagCatalogState = {
      message:
        tagsResult.error || stylesResult.error
          ? "Could not load the tag catalog. Run the latest tag migration, then refresh this page."
          : undefined,
      tags: (tagsResult.data ?? []) as TagDefinition[],
      styles: (stylesResult.data ?? []) as TagStyle[],
    };
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-heading text-4xl font-semibold text-foreground">
          {roleTitle}
        </h1>
      </div>

      <ModerationSearch
        canManageUserTags={canManageUserTags}
        initialState={initialSearchState}
      />

      {initialTagCatalogState ? (
        <TagCatalogManagement initialState={initialTagCatalogState} />
      ) : null}

      <TermSearch canEditTerms={canManageTerms} preferences={preferences} />

      {canManageTerms ? <TermManagement /> : null}

      {canManageCommunityDecks ? (
        <CommunityDeckManagement preferences={preferences} />
      ) : null}
    </div>
  );
}
