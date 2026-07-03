"use server";

import { createClient } from "@/lib/supabase/server";

type Role = "member" | "moderator" | "admin" | "developer";

const USERS_PER_PAGE = 20;

export type UserSearchResult = {
  id: string;
  email: string;
  username: string;
  role: Role;
  created_at: string;
  total_count: number;
};

export type UserSearchState = {
  message?: string;
  results?: UserSearchResult[];
  query?: string;
  page?: number;
  totalCount?: number;
};

function getRequiredString(formData: FormData, name: string) {
  const value = formData.get(name);

  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function getErrorMessage(error: unknown, fallback: string) {
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string" &&
    error.message.trim() &&
    error.message.trim() !== "{}"
  ) {
    return error.message;
  }

  return fallback;
}

function getRequestedPage(formData: FormData) {
  const value = Number(getRequiredString(formData, "page"));

  if (!Number.isInteger(value) || value < 1) {
    return 1;
  }

  return value;
}

async function getAuthorizedSupabaseClient() {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user?.id) {
    return {
      supabase,
      authorized: false,
      message: "Sign in again before searching users.",
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (
    profileError ||
    !profile ||
    !["moderator", "admin", "developer"].includes(profile.role)
  ) {
    return {
      supabase,
      authorized: false,
      message: "You do not have access to user search.",
    };
  }

  return { supabase, authorized: true, message: null };
}

export async function getUserSearchPage(
  query = "",
  page = 1,
): Promise<UserSearchState> {
  const safePage = Math.max(1, page);
  const { supabase, authorized, message } = await getAuthorizedSupabaseClient();

  if (!authorized) {
    return {
      message: message ?? "You do not have access to user search.",
      query,
      page: safePage,
      totalCount: 0,
      results: [],
    };
  }

  const { data, error } = await supabase.rpc("search_users_for_moderation", {
    search_query: query,
    page_size: USERS_PER_PAGE,
    page_offset: (safePage - 1) * USERS_PER_PAGE,
  });

  if (error) {
    if (
      error.message.includes("schema cache") ||
      error.message.includes("search_users_for_moderation")
    ) {
      return {
        message:
          "User search is not installed in Supabase yet. Run the latest moderation user search SQL in Supabase, then refresh this page.",
        query,
        page: safePage,
        totalCount: 0,
        results: [],
      };
    }

    return {
      message: getErrorMessage(error, "Could not search users."),
      query,
      page: safePage,
      totalCount: 0,
      results: [],
    };
  }

  const results = (data ?? []) as UserSearchResult[];

  return {
    results,
    query,
    page: safePage,
    totalCount: results[0]?.total_count ?? 0,
  };
}

export async function searchUsers(
  _state: UserSearchState,
  formData: FormData,
): Promise<UserSearchState> {
  const query = getRequiredString(formData, "query");
  const page = getRequestedPage(formData);

  return getUserSearchPage(query, page);
}
