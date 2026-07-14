import type { PartOfSpeech } from "@/lib/terms/parts-of-speech";

export const PROFILE_DECKS_PER_PAGE = 9;
export const PROFILE_WORDS_PER_PAGE = 10;

export type ProfileDeck = {
  description: string | null;
  id: string;
  title: string;
};

export type ProfileTerm = {
  added_by: string;
  english_definition: string | null;
  id: string;
  notes: string | null;
  parts_of_speech: PartOfSpeech[] | null;
  pinyin: string;
  short_definition: string | null;
  simplified: string;
  traditional: string | null;
  zhuyin: string;
};

export type ProfilePageResult<T> = {
  items: T[];
  message?: string;
  page: number;
  totalCount: number;
};
