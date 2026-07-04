"use server";

import {
  canEditRole,
  getAssignableRoles,
  hasPermission,
  type AppRole,
} from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import {
  getCanonicalSimplified,
  getGeneratedTermForms,
} from "@/lib/terms/generated-forms";
import {
  normalizePartsOfSpeech,
  type PartOfSpeech,
} from "@/lib/terms/parts-of-speech";
import OpenCC from "opencc-js";
import { convert } from "pinyin-pro";

const USERS_PER_PAGE = 20;
const TERMS_PER_PAGE = 20;
const TERM_SEARCH_CHUNK_SIZE = 1000;
const TERM_SEARCH_MAX_ROWS = 10000;
const MAX_BULK_TERMS = 500;
const BULK_TERM_DEFINITION_PLACEHOLDER = "null";
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

export type TermSearchResult = {
  id: string;
  simplified: string;
  traditional: string | null;
  pinyin: string;
  zhuyin: string;
  english_definition: string | null;
  short_definition: string | null;
  parts_of_speech: PartOfSpeech[] | null;
  notes: string | null;
  added_by: string;
  added_by_display: string;
  is_verified: boolean;
  created_at: string;
};

export type TermSearchState = {
  message?: string;
  results?: TermSearchResult[];
  query?: string;
  page?: number;
  totalCount?: number;
  limited?: boolean;
};

export type TermEditState = {
  message?: string;
  success?: string;
};

export type CommunityDeckAddState = {
  message?: string;
  success?: string;
  deckId?: string;
};

export type CommunityDeckSearchResult = {
  id: string;
  title: string;
  description: string | null;
  created_by: string;
  publication_status: string;
  created_at: string;
};

export type CommunityDeckSearchState = {
  message?: string;
  success?: string;
  results?: CommunityDeckSearchResult[];
  query?: string;
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

function normalizeLoose(value: string) {
  return normalizeTextPart(value).toLowerCase().replace(/\s+/g, "");
}

function normalizePinyinLetters(value: string) {
  return convert(normalizeTextPart(value), { format: "toneNone" })
    .toLowerCase()
    .replace(/u:/g, "v")
    .replace(/ü/g, "v")
    .replace(/[0-5]/g, "")
    .replace(/[^a-zv]/g, "");
}

function normalizePinyinNumbers(value: string) {
  const normalized = normalizeTextPart(value);
  const numbered = /[0-5]/.test(normalized)
    ? normalized
    : convert(normalized, { format: "symbolToNum" });

  return numbered
    .toLowerCase()
    .replace(/u:/g, "v")
    .replace(/ü/g, "v")
    .replace(/[^a-z0-5v]/g, "");
}

function normalizeZhuyinSearch(value: string) {
  return normalizeLoose(value).replace(/[ˊˇˋ˙]/g, "");
}

function termMatchesSearch(term: TermSearchResult, query: string) {
  const rawQuery = normalizeTextPart(query);
  const looseQuery = normalizeLoose(rawQuery);
  const simplifiedQuery = normalizeLoose(toSimplified(rawQuery));
  const traditionalQuery = normalizeLoose(toTraditionalTw(rawQuery));
  const pinyinLetterQuery = normalizePinyinLetters(rawQuery);
  const pinyinNumberQuery = normalizePinyinNumbers(rawQuery);
  const zhuyinQuery = normalizeZhuyinSearch(rawQuery);
  const hanziValues = [
    term.simplified,
    term.traditional,
    toSimplified(term.simplified),
    term.traditional ? toSimplified(term.traditional) : "",
  ].map((value) => normalizeLoose(value ?? ""));
  const storedPinyinLetters = normalizePinyinLetters(term.pinyin);
  const storedPinyinNumbers = normalizePinyinNumbers(term.pinyin);
  const storedZhuyin = normalizeZhuyinSearch(term.zhuyin);

  return (
    hanziValues.some(
      (value) =>
        value.includes(looseQuery) ||
        value.includes(simplifiedQuery) ||
        value.includes(traditionalQuery),
    ) ||
    (pinyinLetterQuery.length > 0 &&
      storedPinyinLetters.includes(pinyinLetterQuery)) ||
    (pinyinNumberQuery.length > 0 &&
      /[0-5]/.test(pinyinNumberQuery) &&
      storedPinyinNumbers.includes(pinyinNumberQuery)) ||
    (zhuyinQuery.length > 0 && storedZhuyin.includes(zhuyinQuery))
  );
}

async function getTermSearchCandidates(
  supabase: Awaited<ReturnType<typeof createClient>>,
) {
  const candidates: TermSearchResult[] = [];

  for (
    let offset = 0;
    offset < TERM_SEARCH_MAX_ROWS;
    offset += TERM_SEARCH_CHUNK_SIZE
  ) {
    const { data, error } = await supabase
      .from("terms")
      .select(
        "id,simplified,traditional,pinyin,zhuyin,english_definition,short_definition,parts_of_speech,notes,added_by,is_verified,created_at",
      )
      .order("simplified", { ascending: true })
      .range(offset, offset + TERM_SEARCH_CHUNK_SIZE - 1);

    if (error) {
      return { candidates, error, limited: false };
    }

    const chunk = (data ?? []) as TermSearchResult[];
    candidates.push(...chunk);

    if (chunk.length < TERM_SEARCH_CHUNK_SIZE) {
      return {
        candidates: addAttributionLabels(candidates),
        error: null,
        limited: false,
      };
    }
  }

  return {
    candidates: addAttributionLabels(candidates),
    error: null,
    limited: true,
  };
}

type ModerationTermInsert = {
  simplified: string;
  traditional: string | null;
  pinyin: string;
  zhuyin: string;
  canonical_simplified: string;
  english_definition: string;
  parts_of_speech: PartOfSpeech[] | null;
  added_by: string;
  is_verified: boolean;
};

type ModerationTermInsertResult = {
  inserted_count: number;
  skipped_count: number;
};

function addAttributionLabels(terms: TermSearchResult[]) {
  return terms.map((term) => ({
    ...term,
    added_by_display: term.added_by || "Jingdex",
  }));
}

async function addTermsForModeration(
  supabase: Awaited<ReturnType<typeof createClient>>,
  terms: ModerationTermInsert[],
) {
  const { data, error } = await supabase
    .rpc("add_terms_for_moderation", { term_rows: terms })
    .single();

  return {
    data: data as ModerationTermInsertResult | null,
    error,
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
    .select("role,username")
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
    addedBy: profile.role === "developer" ? "Jingdex" : profile.username,
    authorized: true,
    message: null,
  };
}

async function getAuthorizedCommunityDecksSupabaseClient() {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user?.id) {
    return {
      supabase,
      userId: null,
      authorized: false,
      message: "Sign in again before creating community decks.",
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
    !hasPermission(profile.role, "manageCommunityDecks")
  ) {
    return {
      supabase,
      userId: authData.user.id,
      authorized: false,
      message: "Only admins and developers can create community decks.",
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
  const normalizedQuery = normalizeTextPart(query);
  const { supabase, authorized, message } = await getAuthorizedSupabaseClient();

  if (!authorized) {
    return {
      message: message ?? "You do not have access to user search.",
      query: normalizedQuery,
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

  if (!normalizedQuery) {
    return {
      results: [],
      query: "",
      page: safePage,
      totalCount: 0,
      currentUserId,
      currentUserRole: currentProfile?.role as AppRole | undefined,
    };
  }

  const { data, error } = await supabase.rpc("search_users_for_moderation", {
    search_query: normalizedQuery,
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
        query: normalizedQuery,
        page: safePage,
        totalCount: 0,
        results: [],
        currentUserId,
        currentUserRole: currentProfile?.role as AppRole | undefined,
      };
    }

    return {
      message: getErrorMessage(error, "Could not search users."),
      query: normalizedQuery,
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
    query: normalizedQuery,
    page: safePage,
    totalCount: results[0]?.total_count ?? 0,
    currentUserId,
    currentUserRole: currentProfile?.role as AppRole | undefined,
  };
}

export async function getTermSearchPage(
  query = "",
  page = 1,
): Promise<TermSearchState> {
  const safePage = Math.max(1, page);
  const normalizedQuery = normalizeTextPart(query);

  if (!normalizedQuery) {
    return {
      query: "",
      page: safePage,
      totalCount: 0,
      results: [],
    };
  }

  const { supabase, authorized, message } = await getAuthorizedSupabaseClient();

  if (!authorized) {
    return {
      message: message ?? "You do not have access to term search.",
      query: normalizedQuery,
      page: safePage,
      totalCount: 0,
      results: [],
    };
  }

  const { candidates, error, limited } = await getTermSearchCandidates(supabase);

  if (error) {
    return {
      message: getErrorMessage(error, "Could not search terms."),
      query: normalizedQuery,
      page: safePage,
      totalCount: 0,
      results: [],
    };
  }

  const matches = candidates.filter((term) =>
    termMatchesSearch(term, normalizedQuery),
  );
  const offset = (safePage - 1) * TERMS_PER_PAGE;

  return {
    results: matches.slice(offset, offset + TERMS_PER_PAGE),
    query: normalizedQuery,
    page: safePage,
    totalCount: matches.length,
    limited,
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

export async function submitTermSearch(
  _state: TermSearchState,
  formData: FormData,
): Promise<TermSearchState> {
  const query = getRequiredString(formData, "query");
  const page = getRequestedPage(formData);

  return getTermSearchPage(query, page);
}

export async function updateTerm(formData: FormData): Promise<TermEditState> {
  const termId = getRequiredString(formData, "termId");
  const simplifiedInput = getNormalizedString(formData, "simplified");
  const traditional = getNormalizedString(formData, "traditional");
  const pinyinInput = getNormalizedString(formData, "pinyin");
  const zhuyin = getNormalizedString(formData, "zhuyin");
  const englishDefinition = getNormalizedString(formData, "englishDefinition");
  const shortDefinition = getNormalizedString(formData, "shortDefinition");
  const partsOfSpeech = normalizePartsOfSpeech(formData.getAll("partsOfSpeech"));
  const notes = getNormalizedString(formData, "notes");
  const isVerified = formData.get("isVerified") === "on";

  if (!termId) {
    return { message: "Choose a valid term to edit." };
  }

  if (!simplifiedInput || !pinyinInput || !zhuyin || !englishDefinition) {
    return {
      message:
        "Simplified, pinyin, zhuyin, and definition cannot be blank.",
    };
  }

  const canonicalSimplified = getCanonicalSimplified(simplifiedInput);

  if (!canonicalSimplified) {
    return { message: "Simplified cannot be blank." };
  }

  const { supabase, authorized, message } =
    await getAuthorizedTermsSupabaseClient();

  if (!authorized) {
    return { message: message ?? "Only admins and developers can edit terms." };
  }

  const { error } = await supabase
    .from("terms")
    .update({
      simplified: canonicalSimplified,
      traditional: traditional || null,
      pinyin: pinyinInput,
      zhuyin,
      canonical_simplified: canonicalSimplified,
      english_definition: englishDefinition,
      short_definition: shortDefinition || null,
      parts_of_speech: partsOfSpeech.length > 0 ? partsOfSpeech : null,
      notes: notes || null,
      is_verified: isVerified,
    })
    .eq("id", termId);

  if (error) {
    if (error.code === "23505") {
      return {
        message:
          "Another term already uses that simplified form. Choose a unique term.",
      };
    }

    if (
      error.message.includes("schema cache") ||
      error.message.includes("canonical_simplified")
    ) {
      return {
        message:
          "Term editing is not installed in Supabase yet. Run the latest term canonicalization SQL, then refresh this page.",
      };
    }

    return { message: getErrorMessage(error, "Could not update that term.") };
  }

  return { success: `${canonicalSimplified} was updated.` };
}

export async function deleteTerm(termId: string): Promise<TermEditState> {
  const normalizedTermId = termId.trim();

  if (!normalizedTermId) {
    return { message: "Choose a valid term to delete." };
  }

  const { supabase, authorized, message } =
    await getAuthorizedTermsSupabaseClient();

  if (!authorized) {
    return {
      message: message ?? "Only admins and developers can delete terms.",
    };
  }

  const { error } = await supabase
    .from("terms")
    .delete()
    .eq("id", normalizedTermId);

  if (error) {
    return { message: getErrorMessage(error, "Could not delete that term.") };
  }

  return { success: "Term deleted." };
}

export async function addSingleTerm(
  _state: TermAddState,
  formData: FormData,
): Promise<TermAddState> {
  const simplifiedInput = getNormalizedString(formData, "simplified");
  const traditional = getNormalizedString(formData, "traditional");
  const pinyinInput = getNormalizedString(formData, "pinyin");
  const zhuyin = getNormalizedString(formData, "zhuyin");
  const englishDefinition = getNormalizedString(formData, "definition");
  const partsOfSpeech = normalizePartsOfSpeech(formData.getAll("partsOfSpeech"));

  if (
    !simplifiedInput ||
    !pinyinInput ||
    !zhuyin ||
    !englishDefinition
  ) {
    return {
      message:
        "Add simplified, pinyin, zhuyin, and a definition before saving.",
    };
  }

  const canonicalSimplified = getCanonicalSimplified(simplifiedInput);

  if (!canonicalSimplified) {
    return { message: "Add a valid simplified term before saving." };
  }

  const { supabase, userId, addedBy, authorized, message } =
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

  const { data, error } = await addTermsForModeration(supabase, [
    {
      simplified: canonicalSimplified,
      traditional: traditional || null,
      pinyin: pinyinInput,
      zhuyin,
      canonical_simplified: canonicalSimplified,
      english_definition: englishDefinition,
      parts_of_speech: partsOfSpeech.length > 0 ? partsOfSpeech : null,
      added_by: addedBy ?? "Jingdex",
      is_verified: true,
    },
  ]);

  if (error) {
    if (error.code === "23505") {
      return {
        skippedCount: 1,
        success: `${canonicalSimplified} already exists. No duplicate was created.`,
      };
    }

    if (
      error.message.includes("schema cache") ||
      error.message.includes("canonical_simplified") ||
      error.message.includes("add_terms_for_moderation")
    ) {
      return {
        message:
          "Term importing is not installed in Supabase yet. Run the latest term moderation insert SQL, then refresh this page.",
      };
    }

    return { message: getErrorMessage(error, "Could not add that term.") };
  }

  if (!data?.inserted_count) {
    return {
      skippedCount: 1,
      success: `${canonicalSimplified} already exists. No duplicate was created.`,
    };
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
  let duplicateInputCount = 0;
  const terms = rawText
    .split(/\r?\n/)
    .map(normalizeTextPart)
    .filter(Boolean)
    .map(getGeneratedTermForms)
    .filter((term) => {
      if (!term.canonicalSimplified || seenTerms.has(term.canonicalSimplified)) {
        duplicateInputCount += term.canonicalSimplified ? 1 : 0;
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

  const { supabase, userId, addedBy, authorized, message } =
    await getAuthorizedTermsSupabaseClient();

  if (!authorized || !userId) {
    return { message: message ?? "Only admins and developers can add terms." };
  }

  const { data, error } = await addTermsForModeration(
    supabase,
    terms.map((term) => ({
      simplified: term.simplified,
      traditional: term.traditional,
      pinyin: term.pinyin,
      zhuyin: term.zhuyin,
      canonical_simplified: term.canonicalSimplified,
      english_definition: BULK_TERM_DEFINITION_PLACEHOLDER,
      parts_of_speech: null,
      added_by: addedBy ?? "Jingdex",
      is_verified: true,
    })),
  );

  if (error) {
    if (
      error.message.includes("schema cache") ||
      error.message.includes("canonical_simplified") ||
      error.message.includes("add_terms_for_moderation")
    ) {
      return {
        message:
          "Term importing is not installed in Supabase yet. Run the latest term moderation insert SQL, then refresh this page.",
      };
    }

    return { message: getErrorMessage(error, "Could not import that file.") };
  }

  const insertedCount = data?.inserted_count ?? 0;
  const existingDuplicateCount =
    data?.skipped_count ?? terms.length - insertedCount;
  const skippedCount = existingDuplicateCount + duplicateInputCount;

  return {
    insertedCount,
    skippedCount,
    success: `Added ${insertedCount} ${
      insertedCount === 1 ? "word" : "words"
    }. ${skippedCount} duplicate ${
      skippedCount === 1 ? "word was" : "words were"
    } not added.`,
  };
}

export async function createCommunityDeck(
  _state: CommunityDeckAddState,
  formData: FormData,
): Promise<CommunityDeckAddState> {
  const title = getNormalizedString(formData, "title");
  const description = getNormalizedString(formData, "description");
  const termIds = formData
    .getAll("termIds")
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean);
  const uniqueTermIds = Array.from(new Set(termIds));

  if (!title) {
    return { message: "Add a title before publishing." };
  }

  if (!description) {
    return { message: "Add a description before publishing." };
  }

  if (uniqueTermIds.length === 0) {
    return { message: "Add at least one term before publishing." };
  }

  if (uniqueTermIds.length > 500) {
    return { message: "Publish decks with 500 terms or fewer." };
  }

  const { supabase, userId, authorized, message } =
    await getAuthorizedCommunityDecksSupabaseClient();

  if (!authorized || !userId) {
    return {
      message: message ?? "Only admins and developers can create community decks.",
    };
  }

  const { data: existingTerms, error: termsError } = await supabase
    .from("terms")
    .select("id")
    .in("id", uniqueTermIds);

  if (termsError) {
    return { message: getErrorMessage(termsError, "Could not check terms.") };
  }

  const existingTermIds = new Set((existingTerms ?? []).map((term) => term.id));
  const orderedTermIds = uniqueTermIds.filter((termId) =>
    existingTermIds.has(termId),
  );

  if (orderedTermIds.length !== uniqueTermIds.length) {
    return {
      message:
        "One or more selected terms could not be found. Refresh the search and try again.",
    };
  }

  const { data: deck, error: deckError } = await supabase
    .from("decks")
    .insert({
      title,
      description,
      created_by: "Jingdex",
      created_by_user_id: userId,
      visibility: "community",
      publication_status: "under_review",
      submitted_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (deckError || !deck?.id) {
    return {
      message: getErrorMessage(deckError, "Could not create that community deck."),
    };
  }

  const deckId = deck.id as string;
  const { error: deckTermsError } = await supabase.from("deck_terms").insert(
    orderedTermIds.map((termId, index) => ({
      deck_id: deckId,
      term_id: termId,
      position: index,
    })),
  );

  if (deckTermsError) {
    await supabase.from("decks").delete().eq("id", deckId);

    return {
      message: getErrorMessage(deckTermsError, "Could not add terms to the deck."),
    };
  }

  const reviewedAt = new Date().toISOString();
  const { error: publishError } = await supabase
    .from("decks")
    .update({
      publication_status: "approved",
      reviewed_at: reviewedAt,
      reviewed_by_user_id: userId,
    })
    .eq("id", deckId);

  if (publishError) {
    await supabase.from("decks").delete().eq("id", deckId);

    return {
      message: getErrorMessage(publishError, "Could not publish that deck."),
    };
  }

  return {
    deckId,
    success: `${title} was published with ${orderedTermIds.length} ${
      orderedTermIds.length === 1 ? "term" : "terms"
    }.`,
  };
}

export async function getCommunityDeckSearchPage(
  query = "",
): Promise<CommunityDeckSearchState> {
  const normalizedQuery = normalizeTextPart(query);
  const { supabase, authorized, message } =
    await getAuthorizedCommunityDecksSupabaseClient();

  if (!authorized) {
    return {
      message:
        message ?? "Only admins and developers can search community decks.",
      query: normalizedQuery,
      results: [],
    };
  }

  if (!normalizedQuery) {
    return {
      query: "",
      results: [],
    };
  }

  const { data, error } = await supabase
    .from("decks")
    .select(
      "id,title,description,created_by,publication_status,created_at",
    )
    .eq("visibility", "community")
    .ilike("title", `%${normalizedQuery}%`)
    .order("title", { ascending: true })
    .limit(20);

  if (error) {
    return {
      message: getErrorMessage(error, "Could not search community decks."),
      query: normalizedQuery,
      results: [],
    };
  }

  return {
    query: normalizedQuery,
    results: (data ?? []) as CommunityDeckSearchResult[],
  };
}

export async function deleteCommunityDeck(
  deckId: string,
): Promise<CommunityDeckSearchState> {
  const normalizedDeckId = deckId.trim();

  if (!normalizedDeckId) {
    return { message: "Choose a valid community deck to delete." };
  }

  const { supabase, authorized, message } =
    await getAuthorizedCommunityDecksSupabaseClient();

  if (!authorized) {
    return {
      message: message ?? "Only admins and developers can delete community decks.",
    };
  }

  const { data: deck, error: deckError } = await supabase
    .from("decks")
    .select("title")
    .eq("id", normalizedDeckId)
    .eq("visibility", "community")
    .maybeSingle();

  if (deckError) {
    return {
      message: getErrorMessage(deckError, "Could not check that deck."),
    };
  }

  if (!deck) {
    return { message: "That community deck could not be found." };
  }

  const { error } = await supabase
    .from("decks")
    .delete()
    .eq("id", normalizedDeckId)
    .eq("visibility", "community");

  if (error) {
    return {
      message: getErrorMessage(error, "Could not delete that community deck."),
    };
  }

  return {
    success: `${deck.title} was deleted.`,
  };
}
