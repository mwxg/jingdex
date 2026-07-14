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

export default async function UserProfilePage({
  params,
}: Readonly<{ params: Promise<{ user: string }> }>) {
  const [{ user: requestedUsername }, viewer] = await Promise.all([
    params,
    getViewer(),
  ]);

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
      .select("id,title,description")
      .eq("created_by_user_id", viewer.userId)
      .eq("visibility", "community")
      .eq("publication_status", "approved")
      .order("created_at", { ascending: false }),
    supabase
      .from("terms")
      .select("id,simplified,traditional,pinyin,zhuyin,english_definition,short_definition,parts_of_speech,notes,added_by")
      .eq("added_by_user_id", viewer.userId)
      .eq("is_verified", true)
      .order("created_at", { ascending: false }),
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
      decks={(decksResult.data ?? []) as ProfileDeck[]}
      preferences={normalizeLanguagePreferences(viewer.profile)}
      terms={(termsResult.data ?? []) as ProfileTerm[]}
      username={profile.username}
    />
  );
}
