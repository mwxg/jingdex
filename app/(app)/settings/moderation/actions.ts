"use server";

import {
  canEditRole,
  getAssignableRoles,
  hasPermission,
  type AppRole,
} from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";

const USERS_PER_PAGE = 20;

export type UserSearchResult = {
  id: string;
  email: string;
  username: string;
  role: AppRole;
  created_at: string;
  total_count: number;
};

export type UserSearchState = {
  message?: string;
  success?: string;
  results?: UserSearchResult[];
  query?: string;
  page?: number;
  totalCount?: number;
  currentUserId?: string;
  currentUserRole?: AppRole;
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
    !hasPermission(profile.role, "searchUsers")
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

  const { data: authData } = await supabase.auth.getUser();
  const currentUserId = authData.user?.id;
  const { data: currentProfile } = currentUserId
    ? await supabase
        .from("profiles")
        .select("role")
        .eq("id", currentUserId)
        .maybeSingle()
    : { data: null };

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
        currentUserId,
        currentUserRole: currentProfile?.role as AppRole | undefined,
      };
    }

    return {
      message: getErrorMessage(error, "Could not search users."),
      query,
      page: safePage,
      totalCount: 0,
      results: [],
      currentUserId,
      currentUserRole: currentProfile?.role as AppRole | undefined,
    };
  }

  const results = (data ?? []) as UserSearchResult[];

  return {
    results,
    query,
    page: safePage,
    totalCount: results[0]?.total_count ?? 0,
    currentUserId,
    currentUserRole: currentProfile?.role as AppRole | undefined,
  };
}

async function updateUserRole(formData: FormData) {
  const targetUserId = getRequiredString(formData, "targetUserId");
  const role = getRequiredString(formData, "role") as AppRole;

  const { supabase, authorized, message } = await getAuthorizedSupabaseClient();
  const { data: authData } = await supabase.auth.getUser();
  const actorUserId = authData.user?.id;
  const { data: actorProfile } = actorUserId
    ? await supabase
        .from("profiles")
        .select("role")
        .eq("id", actorUserId)
        .maybeSingle()
    : { data: null };

  if (!targetUserId || !getAssignableRoles(actorProfile?.role).includes(role)) {
    return "Choose a valid role.";
  }

  if (!authorized) {
    return message ?? "You do not have access to edit roles.";
  }

  const { data: targetProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", targetUserId)
    .maybeSingle();

  if (!targetProfile || !canEditRole(actorProfile?.role, targetProfile.role)) {
    return "You do not have access to edit that role.";
  }

  const { error } = await supabase.rpc("update_user_role_for_moderation", {
    target_user_id: targetUserId,
    target_role: role,
  });

  if (error) {
    if (
      error.message.includes("schema cache") ||
      error.message.includes("update_user_role_for_moderation")
    ) {
      return "Role editing is not installed in Supabase yet. Run the latest role-management SQL, then refresh this page.";
    }

    return getErrorMessage(error, "Could not update that user's role.");
  }

  return null;
}

export async function submitUserModeration(
  _state: UserSearchState,
  formData: FormData,
): Promise<UserSearchState> {
  const query = getRequiredString(formData, "query");
  const page = getRequestedPage(formData);
  const intent = getRequiredString(formData, "intent");

  if (intent === "updateRole") {
    const message = await updateUserRole(formData);
    const nextState = await getUserSearchPage(query, page);

    if (message) {
      return { ...nextState, message };
    }

    return { ...nextState, success: "Role updated." };
  }

  return getUserSearchPage(query, page);
}
