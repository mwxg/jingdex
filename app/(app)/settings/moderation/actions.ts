"use server";

import { createClient } from "@/lib/supabase/server";

type Role = "member" | "moderator" | "admin" | "developer";

export type UserSearchResult = {
  id: string;
  email: string;
  username: string;
  role: Role;
  created_at: string;
};

export type UserSearchState = {
  message?: string;
  results?: UserSearchResult[];
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

export async function searchUsers(
  _state: UserSearchState,
  formData: FormData,
): Promise<UserSearchState> {
  const query = getRequiredString(formData, "query");

  if (!query) {
    return { message: "Enter an email or username." };
  }

  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user?.id) {
    return { message: "Sign in again before searching users." };
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
    return { message: "You do not have access to user search." };
  }

  const { data, error } = await supabase.rpc("search_users_for_moderation", {
    search_query: query,
  });

  if (error) {
    if (
      error.message.includes("schema cache") ||
      error.message.includes("search_users_for_moderation")
    ) {
      return {
        message:
          "User search is not installed in Supabase yet. Apply the latest migration, then try again.",
      };
    }

    return {
      message: getErrorMessage(error, "Could not search users."),
    };
  }

  return { results: (data ?? []) as UserSearchResult[] };
}
