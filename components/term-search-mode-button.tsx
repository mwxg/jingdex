"use client";

import {
  getNextTermSearchMode,
  type TermSearchMode,
} from "@/lib/terms/search-mode";

const MODE_DETAILS: Record<
  TermSearchMode,
  { abbreviation: string; label: string }
> = {
  all: { abbreviation: "A", label: "All fields" },
  english: { abbreviation: "E", label: "English definitions" },
  chinese: { abbreviation: "C", label: "Chinese, pinyin, or zhuyin" },
};

export function TermSearchModeButton({
  mode,
  onChange,
}: Readonly<{
  mode: TermSearchMode;
  onChange: (mode: TermSearchMode) => void;
}>) {
  const details = MODE_DETAILS[mode];
  const nextMode = getNextTermSearchMode(mode);

  return (
    <button
      aria-label={`Search mode: ${details.label}. Click to switch to ${MODE_DETAILS[nextMode].label}.`}
      className="flex size-12 shrink-0 items-center justify-center rounded-full border border-muted-background bg-surface font-sans text-base font-bold text-foreground transition-colors hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      onClick={() => onChange(nextMode)}
      title={`Search: ${details.label}`}
      type="button"
    >
      {details.abbreviation}
    </button>
  );
}

