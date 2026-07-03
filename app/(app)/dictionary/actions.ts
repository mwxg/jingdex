"use server";

import { createClient } from "@/lib/supabase/server";
import { type PartOfSpeech } from "@/lib/terms/parts-of-speech";
import OpenCC from "opencc-js";
import { convert } from "pinyin-pro";

const DICTIONARY_MAX_RESULTS = 100;
const TERM_SEARCH_CHUNK_SIZE = 1000;
const TERM_SEARCH_MAX_ROWS = 10000;
const toSimplified = OpenCC.Converter({ from: "tw", to: "cn" });
const toTraditionalTw = OpenCC.Converter({ from: "cn", to: "tw" });

export type DictionarySort = "pinyin-asc";

export type DictionaryTerm = {
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
};

export type DictionarySearchState = {
  message?: string;
  results: DictionaryTerm[];
  query: string;
  sort: DictionarySort;
  totalCount: number;
  limited?: boolean;
};

function normalizeTextPart(value: string) {
  return value.trim().normalize("NFC");
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

function termMatchesSearch(term: DictionaryTerm, query: string) {
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

function compareByPinyin(left: DictionaryTerm, right: DictionaryTerm) {
  const pinyinComparison = normalizePinyinLetters(left.pinyin).localeCompare(
    normalizePinyinLetters(right.pinyin),
  );

  if (pinyinComparison !== 0) {
    return pinyinComparison;
  }

  return left.simplified.localeCompare(right.simplified, "zh-Hans");
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

function addAttributionLabels(terms: DictionaryTerm[]) {
  return terms.map((term) => ({
    ...term,
    added_by_display: term.added_by || "Jingdex",
  }));
}

async function getDictionaryCandidates() {
  const supabase = await createClient();
  const candidates: DictionaryTerm[] = [];

  for (
    let offset = 0;
    offset < TERM_SEARCH_MAX_ROWS;
    offset += TERM_SEARCH_CHUNK_SIZE
  ) {
    const { data, error } = await supabase
      .from("terms")
      .select(
        "id,simplified,traditional,pinyin,zhuyin,english_definition,short_definition,parts_of_speech,notes,added_by",
      )
      .order("pinyin", { ascending: true })
      .range(offset, offset + TERM_SEARCH_CHUNK_SIZE - 1);

    if (error) {
      return { candidates, error, limited: false };
    }

    const chunk = (data ?? []) as DictionaryTerm[];
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

export async function searchDictionary(
  query = "",
  sort: DictionarySort = "pinyin-asc",
): Promise<DictionarySearchState> {
  const normalizedQuery = normalizeTextPart(query);

  if (!normalizedQuery) {
    return {
      results: [],
      query: "",
      sort,
      totalCount: 0,
    };
  }

  const { candidates, error, limited } = await getDictionaryCandidates();

  if (error) {
    return {
      message: getErrorMessage(error, "Could not search dictionary terms."),
      results: [],
      query: normalizedQuery,
      sort,
      totalCount: 0,
    };
  }

  const matches = candidates
    .filter((term) => termMatchesSearch(term, normalizedQuery))
    .sort(compareByPinyin);

  return {
    results: matches.slice(0, DICTIONARY_MAX_RESULTS),
    query: normalizedQuery,
    sort,
    totalCount: matches.length,
    limited,
  };
}
