import { notFound } from "next/navigation";
import { getViewer } from "@/lib/auth/viewer";
import { normalizeLanguagePreferences } from "@/lib/preferences/language";
import { createClient } from "@/lib/supabase/server";
import { ProfileContent } from "./profile-content";
import {
  PROFILE_DECKS_PER_PAGE,
  PROFILE_WORDS_PER_PAGE,
  type ProfileDeck,
  type ProfileTerm,
} from "./types";

type ProfileRow = {
  created_at: string;
  id: string;
  is_public: boolean;
  username: string;
};

type ProfileSearchParams = {
  decksPage?: string | string[];
  wordsPage?: string | string[];
};

function getPage(value: string | string[] | undefined) {
  const firstValue = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(firstValue ?? "1", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export default async function UserProfilePage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ user: string }>;
  searchParams: Promise<ProfileSearchParams>;
}>) {
  const [{ user: requestedUsername }, query, viewer] = await Promise.all([
    params,
    searchParams,
    getViewer(),
  ]);
  const deckPage = getPage(query.decksPage);
  const wordPage = getPage(query.wordsPage);
  const deckFrom = (deckPage - 1) * PROFILE_DECKS_PER_PAGE;
  const wordFrom = (wordPage - 1) * PROFILE_WORDS_PER_PAGE;

  if (!viewer.userId || !viewer.profile) notFound();

  const supabase = await createClient();
  const { data: profileData } = await supabase
    .from("profiles")
    .select("id,username,created_at,is_public")
    .eq("username", requestedUsername)
    .maybeSingle();
  const profile = profileData as ProfileRow | null;

  if (!profile) notFound();

  const isOwner = profile.id === viewer.userId;
  const canViewContent = profile.is_public || isOwner;
  const contentResults = canViewContent
    ? await Promise.all([
        supabase
          .from("profile_bios")
          .select("bio")
          .eq("user_id", profile.id)
          .maybeSingle(),
        supabase
      .from("decks")
      .select("id,title,description", { count: "exact" })
      .eq("created_by_user_id", profile.id)
      .eq("visibility", "community")
      .eq("publication_status", "approved")
      .order("created_at", { ascending: false })
      .range(deckFrom, deckFrom + PROFILE_DECKS_PER_PAGE - 1),
        supabase
      .from("terms")
      .select("id,simplified,traditional,pinyin,zhuyin,english_definition,short_definition,parts_of_speech,notes,added_by", { count: "exact" })
      .eq("added_by_user_id", profile.id)
      .eq("is_verified", true)
      .order("created_at", { ascending: false })
      .range(wordFrom, wordFrom + PROFILE_WORDS_PER_PAGE - 1),
      ])
    : null;
  const bio = contentResults?.[0].data?.bio ?? null;
  const decksResult = contentResults?.[1] ?? { count: 0, data: [] };
  const termsResult = contentResults?.[2] ?? { count: 0, data: [] };

  const createdAt = new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(profile.created_at));

  return (
    <ProfileContent
      bio={bio}
      canViewContent={canViewContent}
      createdAt={createdAt}
      deckCount={decksResult.count ?? 0}
      deckPage={deckPage}
      decks={(decksResult.data ?? []) as ProfileDeck[]}
      isOwner={isOwner}
      isPublic={profile.is_public}
      preferences={normalizeLanguagePreferences(viewer.profile)}
      terms={(termsResult.data ?? []) as ProfileTerm[]}
      username={profile.username}
      wordCount={termsResult.count ?? 0}
      wordPage={wordPage}
    />
  );
}
