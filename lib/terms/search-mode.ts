export type TermSearchMode = "english" | "chinese" | "all";

const SEARCH_MODE_ORDER: TermSearchMode[] = ["all", "english", "chinese"];

export function getNextTermSearchMode(mode: TermSearchMode): TermSearchMode {
  const currentIndex = SEARCH_MODE_ORDER.indexOf(mode);
  return SEARCH_MODE_ORDER[(currentIndex + 1) % SEARCH_MODE_ORDER.length];
}

export function containsChineseSearchCharacters(value: string) {
  return /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\u3100-\u312f\u31a0-\u31bf]/u.test(
    value,
  );
}

