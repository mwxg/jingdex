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

export async function getProfileDeckPage(
  requestedPage: number,
): Promise<ProfilePageResult<ProfileDeck>> {
  const page = normalizePage(requestedPage);
  const { supabase, userId } = await getAuthenticatedUserId();

  if (!userId) {
    return {
      items: [],
      message: "Sign in again to view profile decks.",
      page,
      totalCount: 0,
    };
  }

  const from = (page - 1) * PROFILE_DECKS_PER_PAGE;
  const { data, error, count } = await supabase
    .from("decks")
    .select("id,title,description", { count: "exact" })
    .eq("created_by_user_id", userId)
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
  requestedPage: number,
): Promise<ProfilePageResult<ProfileTerm>> {
  const page = normalizePage(requestedPage);
  const { supabase, userId } = await getAuthenticatedUserId();

  if (!userId) {
    return {
      items: [],
      message: "Sign in again to view contributed words.",
      page,
      totalCount: 0,
    };
  }

  const from = (page - 1) * PROFILE_WORDS_PER_PAGE;
  const { data, error, count } = await supabase
    .from("terms")
    .select("id,simplified,traditional,pinyin,zhuyin,english_definition,short_definition,parts_of_speech,notes,added_by", { count: "exact" })
    .eq("added_by_user_id", userId)
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

  const { error } = await supabase
    .from("profiles")
    .update({ bio: bio || null })
    .eq("id", userId);

  if (error) {
    return { message: "Could not update your bio." };
  }

  revalidatePath("/users", "layout");
  return { success: "Bio updated." };
}
