export const characterSetOptions = ["simplified", "traditional"] as const;
export const pronunciationOptions = ["pinyin", "zhuyin"] as const;

export type CharacterSetPreference = (typeof characterSetOptions)[number];
export type PronunciationPreference = (typeof pronunciationOptions)[number];

export type LanguagePreferences = {
  characterSet: CharacterSetPreference;
  pronunciation: PronunciationPreference;
};

export const defaultLanguagePreferences: LanguagePreferences = {
  characterSet: "simplified",
  pronunciation: "pinyin",
};

export type ChineseForms = {
  simplified: string;
  traditional: string | null;
};

export function isCharacterSetPreference(
  value: string | null | undefined,
): value is CharacterSetPreference {
  return characterSetOptions.includes(value as CharacterSetPreference);
}

export function isPronunciationPreference(
  value: string | null | undefined,
): value is PronunciationPreference {
  return pronunciationOptions.includes(value as PronunciationPreference);
}

export function normalizeLanguagePreferences(profile?: {
  preferred_character_set?: string | null;
  preferred_pronunciation?: string | null;
} | null): LanguagePreferences {
  return {
    characterSet: isCharacterSetPreference(profile?.preferred_character_set)
      ? profile.preferred_character_set
      : defaultLanguagePreferences.characterSet,
    pronunciation: isPronunciationPreference(profile?.preferred_pronunciation)
      ? profile.preferred_pronunciation
      : defaultLanguagePreferences.pronunciation,
  };
}

export function getChineseDisplayForms(
  term: ChineseForms,
  characterSet: CharacterSetPreference,
) {
  const traditional = term.traditional?.trim() || null;
  const preferredTraditional =
    characterSet === "traditional" && traditional ? traditional : null;
  const primary = preferredTraditional ?? term.simplified;
  const secondary =
    primary === term.simplified ? traditional : term.simplified;

  return {
    primary,
    secondary: secondary && secondary !== primary ? secondary : null,
  };
}
