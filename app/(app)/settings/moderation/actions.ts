"use server";

import {
  canEditRole,
  getAssignableRoles,
  hasPermission,
  type AppRole,
} from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import OpenCC from "opencc-js";
import { pinyin } from "pinyin-pro";
import { pinyinToZhuyin } from "pinyin-zhuyin";

const USERS_PER_PAGE = 20;
const MAX_BULK_TERMS = 500;
const TERM_DEFINITION_PLACEHOLDER = "Definition pending.";
const toSimplified = OpenCC.Converter({ from: "tw", to: "cn" });
const toTraditionalTw = OpenCC.Converter({ from: "cn", to: "tw" });

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

export type TermAddState = {
  message?: string;
  success?: string;
  insertedCount?: number;
  skippedCount?: number;
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

function normalizeTextPart(value: string) {
  return value.trim().normalize("NFC");
}

function getNormalizedString(formData: FormData, name: string) {
  const value = formData.get(name);

  if (typeof value !== "string") {
    return "";
  }

  return normalizeTextPart(value);
}

function getCanonicalSimplified(value: string) {
  return normalizeTextPart(toSimplified(value));
}

function getGeneratedTermForms(value: string) {
  const canonicalSimplified = getCanonicalSimplified(value);
  const generatedPinyin = normalizeTextPart(
    pinyin(canonicalSimplified, { toneType: "symbol" }),
  );

  return {
    canonicalSimplified,
    simplified: canonicalSimplified,
    traditional: normalizeTextPart(toTraditionalTw(canonicalSimplified)),
    pinyin: generatedPinyin,
    zhuyin: normalizeTextPart(pinyinToZhuyin(generatedPinyin)),
  };
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

async function getAuthorizedTermsSupabaseClient() {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user?.id) {
    return {
      supabase,
      userId: null,
      authorized: false,
      message: "Sign in again before adding terms.",
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
    !hasPermission(profile.role, "manageTerms")
  ) {
    return {
      supabase,
      userId: authData.user.id,
      authorized: false,
      message: "Only admins and developers can add terms.",
    };
  }

  return {
    supabase,
    userId: authData.user.id,
    authorized: true,
    message: null,
  };
}

function getUploadTextFile(formData: FormData) {
  const file = formData.get("termsFile");

  if (
    !file ||
    typeof file !== "object" ||
    !("text" in file) ||
    typeof file.text !== "function"
  ) {
    return null;
  }

  return file as File;
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

export async function addSingleTerm(
  _state: TermAddState,
  formData: FormData,
): Promise<TermAddState> {
  const simplifiedInput = getNormalizedString(formData, "simplified");
  const traditional = getNormalizedString(formData, "traditional");
  const pinyinInput = getNormalizedString(formData, "pinyin");
  const zhuyin = getNormalizedString(formData, "zhuyin");

  if (!simplifiedInput || !traditional || !pinyinInput || !zhuyin) {
    return {
      message: "Add simplified, traditional, pinyin, and zhuyin before saving.",
    };
  }

  const canonicalSimplified = getCanonicalSimplified(simplifiedInput);

  if (!canonicalSimplified) {
    return { message: "Add a valid simplified term before saving." };
  }

  const { supabase, userId, authorized, message } =
    await getAuthorizedTermsSupabaseClient();

  if (!authorized || !userId) {
    return { message: message ?? "Only admins and developers can add terms." };
  }

  const { data: existingTerm, error: existingError } = await supabase
    .from("terms")
    .select("id")
    .eq("canonical_simplified", canonicalSimplified)
    .maybeSingle();

  if (existingError) {
    if (
      existingError.message.includes("schema cache") ||
      existingError.message.includes("canonical_simplified")
    ) {
      return {
        message:
          "Term duplicate checking is not installed in Supabase yet. Run the latest term canonicalization SQL, then refresh this page.",
      };
    }

    return {
      message: getErrorMessage(existingError, "Could not check that term."),
    };
  }

  if (existingTerm) {
    return {
      skippedCount: 1,
      success: `${canonicalSimplified} already exists. No duplicate was created.`,
    };
  }

  const { error } = await supabase.from("terms").insert({
    simplified: canonicalSimplified,
    traditional,
    pinyin: pinyinInput,
    zhuyin,
    canonical_simplified: canonicalSimplified,
    english_definition: TERM_DEFINITION_PLACEHOLDER,
    added_by: "Jingdex",
    added_by_user_id: userId,
    is_verified: true,
  });

  if (error) {
    if (error.code === "23505") {
      return {
        skippedCount: 1,
        success: `${canonicalSimplified} already exists. No duplicate was created.`,
      };
    }

    if (
      error.message.includes("schema cache") ||
      error.message.includes("canonical_simplified")
    ) {
      return {
        message:
          "Term duplicate checking is not installed in Supabase yet. Run the latest term canonicalization SQL, then refresh this page.",
      };
    }

    return { message: getErrorMessage(error, "Could not add that term.") };
  }

  return {
    insertedCount: 1,
    success: `${canonicalSimplified} was added.`,
  };
}

export async function addBulkTerms(
  _state: TermAddState,
  formData: FormData,
): Promise<TermAddState> {
  const file = getUploadTextFile(formData);

  if (!file || file.size === 0) {
    return { message: "Upload a .txt file with one term per line." };
  }

  if (file.size > 100_000) {
    return { message: "Upload a smaller text file, up to 100 KB." };
  }

  const rawText = await file.text();
  const seenTerms = new Set<string>();
  const terms = rawText
    .split(/\r?\n/)
    .map(normalizeTextPart)
    .filter(Boolean)
    .map(getGeneratedTermForms)
    .filter((term) => {
      if (!term.canonicalSimplified || seenTerms.has(term.canonicalSimplified)) {
        return false;
      }

      seenTerms.add(term.canonicalSimplified);
      return true;
    });

  if (terms.length === 0) {
    return { message: "No valid terms were found in that file." };
  }

  if (terms.length > MAX_BULK_TERMS) {
    return {
      message: `Upload ${MAX_BULK_TERMS} terms or fewer at a time.`,
    };
  }

  const { supabase, userId, authorized, message } =
    await getAuthorizedTermsSupabaseClient();

  if (!authorized || !userId) {
    return { message: message ?? "Only admins and developers can add terms." };
  }

  const { data, error } = await supabase
    .from("terms")
    .upsert(
      terms.map((term) => ({
        simplified: term.simplified,
        traditional: term.traditional,
        pinyin: term.pinyin,
        zhuyin: term.zhuyin,
        canonical_simplified: term.canonicalSimplified,
        english_definition: TERM_DEFINITION_PLACEHOLDER,
        added_by: "Jingdex",
        added_by_user_id: userId,
        is_verified: true,
      })),
      {
        onConflict: "canonical_simplified",
        ignoreDuplicates: true,
      },
    )
    .select("id");

  if (error) {
    if (
      error.message.includes("schema cache") ||
      error.message.includes("canonical_simplified")
    ) {
      return {
        message:
          "Term duplicate checking is not installed in Supabase yet. Run the latest term canonicalization SQL, then refresh this page.",
      };
    }

    return { message: getErrorMessage(error, "Could not import that file.") };
  }

  const insertedCount = data?.length ?? 0;
  const skippedCount = terms.length - insertedCount;

  return {
    insertedCount,
    skippedCount,
    success: `Imported ${insertedCount} ${insertedCount === 1 ? "term" : "terms"}${
      skippedCount > 0
        ? ` and skipped ${skippedCount} existing ${skippedCount === 1 ? "term" : "terms"}`
        : ""
    }.`,
  };
}
