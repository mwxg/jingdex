import { notFound } from "next/navigation";
import { getViewer } from "@/lib/auth/viewer";
import { normalizeLanguagePreferences } from "@/lib/preferences/language";
import { createClient } from "@/lib/supabase/server";
import {
  ProfileContent,
  type ProfileDeck,
  type ProfileTerm,
} from "./profile-content";

type ProfileRow = {
  bio: string | null;
  created_at: string;
  username: string;
};

const DECKS_PER_PAGE = 9;
const WORDS_PER_PAGE = 10;

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
  const deckFrom = (deckPage - 1) * DECKS_PER_PAGE;
  const wordFrom = (wordPage - 1) * WORDS_PER_PAGE;

  if (
    !viewer.userId ||
    !viewer.profile ||
    requestedUsername.toLocaleLowerCase() !==
      viewer.profile.username.toLocaleLowerCase()
  ) {
    notFound();
  }

  const supabase = await createClient();
  const [profileResult, decksResult, termsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("username,created_at,bio")
      .eq("id", viewer.userId)
      .maybeSingle(),
    supabase
      .from("decks")
      .select("id,title,description", { count: "exact" })
      .eq("created_by_user_id", viewer.userId)
      .eq("visibility", "community")
      .eq("publication_status", "approved")
      .order("created_at", { ascending: false })
      .range(deckFrom, deckFrom + DECKS_PER_PAGE - 1),
    supabase
      .from("terms")
      .select("id,simplified,traditional,pinyin,zhuyin,english_definition,short_definition,parts_of_speech,notes,added_by", { count: "exact" })
      .eq("added_by_user_id", viewer.userId)
      .eq("is_verified", true)
      .order("created_at", { ascending: false })
      .range(wordFrom, wordFrom + WORDS_PER_PAGE - 1),
  ]);

  const profile = profileResult.data as ProfileRow | null;
  if (!profile) notFound();

  const createdAt = new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(profile.created_at));

  return (
    <ProfileContent
      bio={profile.bio}
      createdAt={createdAt}
      deckCount={decksResult.count ?? 0}
      deckPage={deckPage}
      decks={(decksResult.data ?? []) as ProfileDeck[]}
      preferences={normalizeLanguagePreferences(viewer.profile)}
      terms={(termsResult.data ?? []) as ProfileTerm[]}
      username={profile.username}
      wordCount={termsResult.count ?? 0}
      wordPage={wordPage}
    />
  );
}
