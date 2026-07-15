"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  PROFILE_DECKS_PER_PAGE,
  PROFILE_WORDS_PER_PAGE,
  type ProfileDeck,
  type ProfilePageResult,
  type ProfileTerm,
} from "./types";

export type BioFormState = {
  message?: string;
  success?: string;
};

function normalizePage(page: number) {
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
}

async function getAuthenticatedUserId() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = error ? null : data?.claims?.sub;
  return { supabase, userId };
}

async function getAccessibleProfile(targetUsername: string) {
  const { supabase, userId } = await getAuthenticatedUserId();

  if (!/^[a-zA-Z0-9][a-zA-Z0-9_]{2,31}$/.test(targetUsername)) {
    return { profileId: null, supabase };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id,is_public")
    .eq("username", targetUsername)
    .maybeSingle();

  const canViewContent =
    Boolean(profile?.is_public) || profile?.id === userId;

  return {
    profileId: canViewContent ? profile?.id ?? null : null,
    supabase,
  };
}

export async function getProfileDeckPage(
  targetUsername: string,
  requestedPage: number,
): Promise<ProfilePageResult<ProfileDeck>> {
  const page = normalizePage(requestedPage);
  const { supabase, profileId } = await getAccessibleProfile(targetUsername);

  if (!profileId) {
    return {
      items: [],
      message: "That profile's decks are not available.",
      page,
      totalCount: 0,
    };
  }

  const from = (page - 1) * PROFILE_DECKS_PER_PAGE;
  const { data, error, count } = await supabase
    .from("decks")
    .select("id,title,description", { count: "exact" })
    .eq("created_by_user_id", profileId)
    .eq("visibility", "community")
    .eq("publication_status", "approved")
    .order("created_at", { ascending: false })
    .range(from, from + PROFILE_DECKS_PER_PAGE - 1);

  if (error) {
    return {
      items: [],
      message: "Could not load that deck page.",
      page,
      totalCount: 0,
    };
  }

  return {
    items: (data ?? []) as ProfileDeck[],
    page,
    totalCount: count ?? 0,
  };
}

export async function getProfileWordPage(
  targetUsername: string,
  requestedPage: number,
): Promise<ProfilePageResult<ProfileTerm>> {
  const page = normalizePage(requestedPage);
  const { supabase, profileId } = await getAccessibleProfile(targetUsername);

  if (!profileId) {
    return {
      items: [],
      message: "That profile's contributed words are not available.",
      page,
      totalCount: 0,
    };
  }

  const from = (page - 1) * PROFILE_WORDS_PER_PAGE;
  const { data, error, count } = await supabase
    .from("terms")
    .select("id,simplified,traditional,pinyin,zhuyin,english_definition,short_definition,parts_of_speech,notes,added_by", { count: "exact" })
    .eq("added_by_user_id", profileId)
    .eq("is_verified", true)
    .order("created_at", { ascending: false })
    .range(from, from + PROFILE_WORDS_PER_PAGE - 1);

  if (error) {
    return {
      items: [],
      message: "Could not load that contributed-word page.",
      page,
      totalCount: 0,
    };
  }

  return {
    items: (data ?? []) as ProfileTerm[],
    page,
    totalCount: count ?? 0,
  };
}

export async function updateBio(
  _state: BioFormState,
  formData: FormData,
): Promise<BioFormState> {
  const rawBio = formData.get("bio");
  const bio = typeof rawBio === "string" ? rawBio.trim() : "";

  if (bio.length > 240) {
    return { message: "Keep your bio to 240 characters or fewer." };
  }

  const supabase = await createClient();
  const { data, error: authError } = await supabase.auth.getClaims();
  const userId = authError ? null : data?.claims?.sub;

  if (!userId) {
    return { message: "Sign in again before editing your bio." };
  }

  const { error } = await supabase.from("profile_bios").upsert({
    bio: bio || null,
    user_id: userId,
  });

  if (error) {
    return { message: "Could not update your bio." };
  }

  revalidatePath("/users", "layout");
  return { success: "Bio updated." };
}
