"use client";

import Image from "next/image";
import {
  getChineseDisplayForms,
  type LanguagePreferences,
} from "@/lib/preferences/language";
import { getPartOfSpeechLabel } from "@/lib/terms/parts-of-speech";
import {
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  searchDictionary,
  type DictionarySearchState,
  type DictionarySort,
  type DictionaryTerm,
} from "./actions";
import { TermSearchModeButton } from "@/components/term-search-mode-button";
import { InlineLoadingStatus } from "@/components/loading";
import {
  containsChineseSearchCharacters,
  type TermSearchMode,
} from "@/lib/terms/search-mode";

const DEFINITION_PREVIEW_LIMIT = 150;
const initialState: DictionarySearchState = {
  results: [],
  query: "",
  sort: "pinyin-asc",
  totalCount: 0,
};

function getDefinitionPreview(term: DictionaryTerm) {
  const definition =
    term.short_definition ||
    term.english_definition?.split(/\r?\n/, 1)[0] ||
    "";

  if (definition.length <= DEFINITION_PREVIEW_LIMIT) {
    return definition;
  }

  return `${definition.slice(0, DEFINITION_PREVIEW_LIMIT).trim()}...`;
}

function getPartsOfSpeechLabel(partsOfSpeech: string[]) {
  return partsOfSpeech.map(getPartOfSpeechLabel).join(", ");
}

function SearchMessage({ state }: Readonly<{ state: DictionarySearchState }>) {
  if (state.message) {
    return (
      <p className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 font-sans text-sm font-bold text-danger">
        {state.message}
      </p>
    );
  }

  if (state.limited) {
    return (
      <p className="rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 font-sans text-sm font-bold text-foreground">
        Searching the first matching candidate set. Try a more specific search
        if the term is missing.
      </p>
    );
  }

  return null;
}

function SearchingStatus({ isSearching }: Readonly<{ isSearching: boolean }>) {
  if (!isSearching) {
    return null;
  }

  return <InlineLoadingStatus label="Searching…" />;
}

function TermDetailsModal({
  onClose,
  preferences,
  term,
}: Readonly<{
  onClose: () => void;
  preferences: LanguagePreferences;
  term: DictionaryTerm;
}>) {
  const forms = getChineseDisplayForms(term, preferences.characterSet);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/25 px-6 py-6">
      <div
        aria-labelledby="dictionary-term-title"
        aria-modal="true"
        className="relative max-h-full w-full max-w-2xl overflow-y-auto rounded-lg border border-muted-background bg-surface p-6 shadow-xl"
        role="dialog"
      >
        <button
          aria-label="Close term details"
          className="absolute right-3 top-3 grid size-10 place-items-center rounded-lg transition-colors hover:bg-muted-background"
          onClick={onClose}
          type="button"
        >
          <Image
            aria-hidden="true"
            alt=""
            height={16}
            src="/icons/cross.svg"
            width={16}
          />
        </button>

        <div className="pr-10">
          <p className="font-sans text-sm font-bold uppercase text-primary">
            Dictionary term
          </p>
          <h2
            className="mt-2 font-chinese text-5xl font-bold text-foreground"
            id="dictionary-term-title"
          >
            {forms.primary}
          </h2>
          {forms.secondary ? (
            <p className="mt-1 font-chinese text-2xl text-muted">
              {forms.secondary}
            </p>
          ) : null}
        </div>

        <dl className="mt-6 grid gap-4 font-sans text-base sm:grid-cols-2">
          <div>
            <dt className="text-sm font-bold text-muted">Pinyin</dt>
            <dd className="mt-1 text-foreground">{term.pinyin}</dd>
          </div>
          <div>
            <dt className="text-sm font-bold text-muted">Zhuyin</dt>
            <dd className="mt-1 text-foreground">{term.zhuyin}</dd>
          </div>
          {term.parts_of_speech && term.parts_of_speech.length > 0 ? (
            <div>
              <dt className="text-sm font-bold text-muted">Part of speech</dt>
              <dd className="mt-1 text-foreground">
                {getPartsOfSpeechLabel(term.parts_of_speech)}
              </dd>
            </div>
          ) : null}
          <div>
            <dt className="text-sm font-bold text-muted">Added by</dt>
            <dd className="mt-1 text-foreground">{term.added_by_display}</dd>
          </div>
          {term.short_definition ? (
            <div>
              <dt className="text-sm font-bold text-muted">
                Short definition
              </dt>
              <dd className="mt-1 text-foreground">{term.short_definition}</dd>
            </div>
          ) : null}
          <div className="sm:col-span-2">
            <dt className="text-sm font-bold text-muted">Definition</dt>
            <dd className="mt-1 whitespace-pre-line leading-7 text-foreground">
              {term.english_definition || "No definition added."}
            </dd>
          </div>
          {term.notes ? (
            <div className="sm:col-span-2">
              <dt className="text-sm font-bold text-muted">Notes</dt>
              <dd className="mt-1 leading-7 text-foreground">{term.notes}</dd>
            </div>
          ) : null}
        </dl>
      </div>
    </div>
  );
}

function TermRow({
  onSelect,
  preferences,
  term,
}: Readonly<{
  onSelect: (term: DictionaryTerm) => void;
  preferences: LanguagePreferences;
  term: DictionaryTerm;
}>) {
  const forms = getChineseDisplayForms(term, preferences.characterSet);

  return (
    <li>
      <button
        className="grid w-full gap-3 px-5 py-4 text-left transition-colors hover:bg-background focus:bg-background focus:outline-none sm:grid-cols-[minmax(10rem,1fr)_minmax(8rem,0.8fr)_minmax(8rem,0.8fr)_minmax(14rem,1.6fr)] sm:items-center"
        onClick={() => onSelect(term)}
        type="button"
      >
        <span className="min-w-0">
          <span className="font-chinese text-3xl font-bold text-foreground">
            {forms.primary}
          </span>
          {forms.secondary ? (
            <span className="ml-3 font-chinese text-lg text-muted">
              {forms.secondary}
            </span>
          ) : null}
        </span>
        <span className="min-w-0 truncate font-sans text-sm text-muted">
          {term.pinyin}
        </span>
        <span className="min-w-0 truncate font-sans text-sm text-muted">
          {term.zhuyin}
        </span>
        <span className="min-w-0 font-sans text-sm leading-6 text-foreground sm:truncate">
          {getDefinitionPreview(term) || "No definition added."}
        </span>
      </button>
    </li>
  );
}

export function DictionarySearch({
  preferences,
}: Readonly<{
  preferences: LanguagePreferences;
}>) {
  const [state, setState] = useState<DictionarySearchState>(initialState);
  const [inputValue, setInputValue] = useState("");
  const [sortValue, setSortValue] = useState<DictionarySort>("pinyin-asc");
  const [searchMode, setSearchMode] = useState<TermSearchMode>("all");
  const [selectedTerm, setSelectedTerm] = useState<DictionaryTerm | null>(null);
  const [isPending, startTransition] = useTransition();
  const requestId = useRef(0);
  const hasQuery = state.query.length > 0;
  const isSearching = isPending && inputValue.trim().length > 0;

  const runSearch = useCallback(
    (nextQuery: string, nextSort = sortValue, nextMode = searchMode) => {
      const currentRequestId = requestId.current + 1;
      requestId.current = currentRequestId;

      if (!nextQuery.trim()) {
        setState({
          results: [],
          query: "",
          sort: nextSort,
          totalCount: 0,
        });
        return;
      }

      startTransition(async () => {
        const nextState = await searchDictionary(nextQuery, nextSort, nextMode);

        if (requestId.current === currentRequestId) {
          setState(nextState);
        }
      });
    },
    [searchMode, sortValue],
  );

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    runSearch(inputValue, sortValue);
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      runSearch(inputValue, sortValue);
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [inputValue, runSearch, searchMode, sortValue]);

  return (
    <section
      aria-busy={isSearching}
      className="rounded-lg border border-muted-background bg-surface p-6"
    >
      <form className="space-y-5" onSubmit={submitSearch}>
        <SearchMessage state={state} />

        <div className="grid gap-3 lg:grid-cols-[1fr_16rem] lg:items-end">
          <div className="space-y-2">
            <label
              className="block font-sans text-sm font-bold text-foreground"
              htmlFor="dictionary-query"
            >
              Hanzi, pinyin, tone numbers, zhuyin, or definition
            </label>
            <div className="flex gap-2">
              <input
                className="h-12 min-w-0 flex-1 rounded-lg border border-muted-background bg-surface px-4 font-sans text-base text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary"
                id="dictionary-query"
                name="query"
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setInputValue(nextValue);
                  if (containsChineseSearchCharacters(nextValue)) {
                    setSearchMode("chinese");
                  }
                }}
                placeholder="Try xuexi, xue2xi2, or ㄒㄩㄝˊ ㄒㄧˊ"
                type="search"
                value={inputValue}
              />
              <TermSearchModeButton mode={searchMode} onChange={setSearchMode} />
            </div>
          </div>

          <label className="space-y-2">
            <span className="block font-sans text-sm font-bold text-foreground">
              Sort
            </span>
            <select
              className="h-12 w-full rounded-lg border border-muted-background bg-surface px-4 font-sans text-base font-bold text-foreground outline-none transition-colors focus:border-primary"
              onChange={(event) =>
                setSortValue(event.target.value as DictionarySort)
              }
              value={sortValue}
            >
              <option value="pinyin-asc">Alphabetical pinyin</option>
            </select>
          </label>
        </div>

        <SearchingStatus isSearching={isSearching} />

        {hasQuery && state.results.length === 0 && !state.message ? (
          <p className="rounded-lg border border-muted-background bg-background px-4 py-3 font-sans text-sm text-muted">
            No terms found.
          </p>
        ) : null}
      </form>

      <div className={`transition-opacity ${isSearching ? "opacity-60" : "opacity-100"}`}>
        {hasQuery && state.results.length > 0 ? (
          <>
          <div className="mt-6 flex flex-col gap-2 font-sans text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
            <span>
              Showing {state.results.length} of {state.totalCount} matches
            </span>
            {state.totalCount > state.results.length ? (
              <span>Only the first 100 terms are shown.</span>
            ) : null}
          </div>

          <div className="mt-3 overflow-hidden rounded-lg border border-muted-background">
            <div className="hidden grid-cols-[minmax(10rem,1fr)_minmax(8rem,0.8fr)_minmax(8rem,0.8fr)_minmax(14rem,1.6fr)] gap-3 border-b border-muted-background bg-muted-background px-5 py-3 font-sans text-sm font-bold text-muted sm:grid">
              <span>Term</span>
              <span>Pinyin</span>
              <span>Zhuyin</span>
              <span>Definition</span>
            </div>
            <ul className="divide-y divide-muted-background">
              {state.results.map((term) => (
                <TermRow
                  key={term.id}
                  onSelect={setSelectedTerm}
                  preferences={preferences}
                  term={term}
                />
              ))}
            </ul>
          </div>
          </>
        ) : null}
      </div>

      {selectedTerm ? (
        <TermDetailsModal
          onClose={() => setSelectedTerm(null)}
          preferences={preferences}
          term={selectedTerm}
        />
      ) : null}
    </section>
  );
}
