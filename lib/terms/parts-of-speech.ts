export const partsOfSpeechOptions = [
  { value: "noun", label: "Noun" },
  { value: "verb", label: "Verb" },
  { value: "adjective", label: "Adjective" },
  { value: "adverb", label: "Adverb" },
  { value: "pronoun", label: "Pronoun" },
  { value: "preposition", label: "Preposition" },
  { value: "conjunction", label: "Conjunction" },
  { value: "particle", label: "Particle" },
  { value: "measure-word", label: "Measure word" },
  { value: "numeral", label: "Numeral" },
  { value: "interjection", label: "Interjection" },
  { value: "idiom", label: "Idiom" },
  { value: "phrase", label: "Phrase" },
] as const;

export type PartOfSpeech = (typeof partsOfSpeechOptions)[number]["value"];

const partsOfSpeechValues = new Set<string>(
  partsOfSpeechOptions.map((option) => option.value),
);

export function getPartOfSpeechLabel(value: string) {
  return (
    partsOfSpeechOptions.find((option) => option.value === value)?.label ??
    value
  );
}

export function normalizePartsOfSpeech(values: unknown[]) {
  const normalized = new Set<PartOfSpeech>();

  for (const value of values) {
    if (typeof value !== "string") {
      continue;
    }

    const trimmedValue = value.trim();

    if (partsOfSpeechValues.has(trimmedValue)) {
      normalized.add(trimmedValue as PartOfSpeech);
    }
  }

  return Array.from(normalized);
}
