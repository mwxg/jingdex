"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  getChineseDisplayForms,
  type LanguagePreferences,
} from "@/lib/preferences/language";
import { PartOfSpeechSelect } from "./part-of-speech-select";
import {
  deleteTerm,
  getTermSearchPage,
  updateTerm,
  type TermEditState,
  type TermSearchResult,
  type TermSearchState,
} from "./actions";
import { TermSearchModeButton } from "@/components/term-search-mode-button";
import { InlineLoadingStatus } from "@/components/loading";
import {
  containsChineseSearchCharacters,
  type TermSearchMode,
} from "@/lib/terms/search-mode";

const TERMS_PER_PAGE = 20;
const initialState: TermSearchState = {
  results: [],
  query: "",
  page: 1,
  totalCount: 0,
};
const initialEditState: TermEditState = {};

function TermSearchMessage({ state }: Readonly<{ state: TermSearchState }>) {
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
        Showing the first matching candidate set. Try a more specific search if
        the term is missing.
      </p>
    );
  }

  // if (!hasQuery) {
  //   return (
  //     <p className="rounded-lg border border-muted-background bg-background px-4 py-3 font-sans text-sm text-muted">
  //       Search by hanzi, pinyin, tone numbers, or zhuyin.
  //     </p>
  //   );
  // }

  return null;
}

function SearchingStatus({ isSearching }: Readonly<{ isSearching: boolean }>) {
  if (!isSearching) {
    return null;
  }

  return <InlineLoadingStatus label="Searching…" />;
}

function EditMessage({ state }: Readonly<{ state: TermEditState }>) {
  if (!state.message && !state.success) {
    return null;
  }

  if (state.message) {
    return (
      <p className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 font-sans text-sm font-bold text-danger">
        {state.message}
      </p>
    );
  }

  return (
    <p className="rounded-lg border border-confirm/30 bg-confirm/10 px-4 py-3 font-sans text-sm font-bold text-confirm">
      {state.success}
    </p>
  );
}

function EditTextInput({
  label,
  name,
  required = false,
  value,
}: Readonly<{
  label: string;
  name: string;
  required?: boolean;
  value: string;
}>) {
  return (
    <label className="space-y-2">
      <span className="block font-sans text-sm font-bold text-foreground">
        {label}
      </span>
      <input
        className="h-12 w-full rounded-lg border border-muted-background bg-surface px-4 font-sans text-base text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary"
        defaultValue={value}
        name={name}
        required={required}
        type="text"
      />
    </label>
  );
}

function EditTextArea({
  label,
  name,
  required = false,
  value,
}: Readonly<{
  label: string;
  name: string;
  required?: boolean;
  value: string;
}>) {
  return (
    <label className="space-y-2">
      <span className="block font-sans text-sm font-bold text-foreground">
        {label}
      </span>
      <textarea
        className="min-h-24 w-full resize-y rounded-lg border border-muted-background bg-surface px-4 py-3 font-sans text-base text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary"
        defaultValue={value}
        name={name}
        required={required}
      />
    </label>
  );
}

function TermEditModal({
  editState,
  isDeleting,
  isSaving,
  onClose,
  onDelete,
  onSubmit,
  preferences,
  term,
}: Readonly<{
  editState: TermEditState;
  isDeleting: boolean;
  isSaving: boolean;
  onClose: () => void;
  onDelete: (term: TermSearchResult) => void;
  onSubmit: (formData: FormData) => void;
  preferences: LanguagePreferences;
  term: TermSearchResult;
}>) {
  const forms = getChineseDisplayForms(term, preferences.characterSet);

  return (
    <div
      aria-labelledby="term-edit-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 px-4 py-6"
      role="dialog"
    >
      <div className="max-h-full w-full max-w-3xl overflow-y-auto rounded-lg border border-muted-background bg-surface p-6 shadow-lg">
        <div className="space-y-2">
          <h2
            id="term-edit-title"
            className="font-heading text-2xl font-semibold text-foreground"
          >
            Edit term
          </h2>
          <p className="font-chinese text-2xl font-bold text-foreground">
            {forms.primary}
          </p>
          <p className="font-sans text-sm text-muted">
            Added by{" "}
            <span className="font-bold text-foreground">
              {term.added_by_display}
            </span>
          </p>
        </div>

        <form action={onSubmit} className="mt-5 space-y-5">
          <input name="termId" type="hidden" value={term.id} />

          <EditMessage state={editState} />

          <div className="grid gap-4 sm:grid-cols-2">
            <EditTextInput
              label="Simplified"
              name="simplified"
              required
              value={term.simplified}
            />
            <EditTextInput
              label="Traditional"
              name="traditional"
              value={term.traditional ?? ""}
            />
            <EditTextInput
              label="Pinyin"
              name="pinyin"
              required
              value={term.pinyin}
            />
            <EditTextInput
              label="Zhuyin"
              name="zhuyin"
              required
              value={term.zhuyin}
            />
            <EditTextInput
              label="Short definition"
              name="shortDefinition"
              value={term.short_definition ?? ""}
            />
            <PartOfSpeechSelect selectedValues={term.parts_of_speech} />
          </div>

          <EditTextArea
            label="Definition"
            name="englishDefinition"
            required
            value={term.english_definition ?? ""}
          />

          <EditTextArea label="Notes" name="notes" value={term.notes ?? ""} />

          <label className="flex items-center gap-3 font-sans text-sm font-bold text-foreground">
            <input
              className="size-4 accent-primary"
              defaultChecked={term.is_verified}
              name="isVerified"
              type="checkbox"
            />
            Verified
          </label>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              className="h-10 rounded-lg border border-danger/40 px-4 font-sans text-sm font-bold text-danger transition-colors hover:border-danger hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isDeleting || isSaving}
              onClick={() => onDelete(term)}
              type="button"
            >
              {isDeleting ? "Deleting" : "Delete"}
            </button>
            <div className="flex justify-end gap-2">
              <button
                className="h-10 rounded-lg border border-muted-background px-4 font-sans text-sm font-bold text-foreground transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isDeleting || isSaving}
                onClick={onClose}
                type="button"
              >
                Cancel
              </button>
              <button
                className="h-10 rounded-lg bg-primary px-4 font-sans text-sm font-bold text-on-primary transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isDeleting || isSaving}
                type="submit"
              >
                {isSaving ? "Saving" : "Save"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function TermRow({
  canEditTerms,
  gridColumns,
  onEdit,
  preferences,
  term,
}: Readonly<{
  canEditTerms: boolean;
  gridColumns: string;
  onEdit: (term: TermSearchResult) => void;
  preferences: LanguagePreferences;
  term: TermSearchResult;
}>) {
  const forms = getChineseDisplayForms(term, preferences.characterSet);

  return (
    <li
      className={`${gridColumns} grid items-center gap-4 px-4 py-4 font-sans text-sm`}
    >
      <div className="min-w-0">
        <p className="truncate font-chinese text-2xl font-bold text-foreground">
          {forms.primary}
        </p>
        {forms.secondary ? (
          <p className="truncate font-chinese text-sm text-muted">
            {forms.secondary}
          </p>
        ) : null}
      </div>
      <span className="min-w-0 truncate text-muted">{term.pinyin}</span>
      <span className="min-w-0 truncate text-muted">{term.zhuyin}</span>
      <span className="min-w-0 truncate text-foreground">
        {term.english_definition ?? "null"}
      </span>
      <span className="whitespace-nowrap text-muted">
        {term.is_verified ? "Yes" : "No"}
      </span>
      {canEditTerms ? (
        <span className="text-right">
          <button
            className="h-9 rounded-lg border border-muted-background px-3 font-sans text-xs font-bold text-foreground transition-colors hover:border-primary hover:text-primary"
            onClick={() => onEdit(term)}
            type="button"
          >
            Edit
          </button>
        </span>
      ) : null}
    </li>
  );
}

export function TermSearch({
  canEditTerms,
  preferences,
}: Readonly<{
  canEditTerms: boolean;
  preferences: LanguagePreferences;
}>) {
  const [state, setState] = useState<TermSearchState>(initialState);
  const [editState, setEditState] = useState<TermEditState>(initialEditState);
  const [inputValue, setInputValue] = useState("");
  const [searchMode, setSearchMode] = useState<TermSearchMode>("all");
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDeleting] = useTransition();
  const [isSaving, startSaving] = useTransition();
  const [selectedTerm, setSelectedTerm] = useState<TermSearchResult | null>(
    null,
  );
  const requestId = useRef(0);
  const results = state.results ?? [];
  const page = state.page ?? 1;
  const query = state.query ?? "";
  const totalCount = state.totalCount ?? 0;
  const hasQuery = query.length > 0;
  const firstResult = totalCount > 0 ? (page - 1) * TERMS_PER_PAGE + 1 : 0;
  const lastResult = Math.min(page * TERMS_PER_PAGE, totalCount);
  const hasPreviousPage = page > 1;
  const hasNextPage = lastResult < totalCount;
  const resultGridColumns = canEditTerms
    ? "grid-cols-[minmax(9rem,1fr)_minmax(9rem,1fr)_minmax(10rem,1fr)_minmax(16rem,1.6fr)_6rem_4.5rem]"
    : "grid-cols-[minmax(9rem,1fr)_minmax(9rem,1fr)_minmax(10rem,1fr)_minmax(16rem,1.6fr)_6rem]";
  const isSearching = isPending && inputValue.trim().length > 0;

  const searchTerms = useCallback(
    (nextQuery: string, nextPage = 1, nextMode = searchMode) => {
      const currentRequestId = requestId.current + 1;
      requestId.current = currentRequestId;

      startTransition(async () => {
        const nextState = await getTermSearchPage(nextQuery, nextPage, nextMode);

        if (requestId.current === currentRequestId) {
          setState(nextState);
        }
      });
    },
    [searchMode],
  );

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    searchTerms(inputValue, 1);
  }

  function editTerm(formData: FormData) {
    startSaving(async () => {
      const nextEditState = await updateTerm(formData);
      setEditState(nextEditState);

      if (!nextEditState.message) {
        setSelectedTerm(null);
        searchTerms(query || inputValue, page);
      }
    });
  }

  function deleteSelectedTerm(term: TermSearchResult) {
    const forms = getChineseDisplayForms(term, preferences.characterSet);
    const confirmed = window.confirm(`Delete ${forms.primary}?`);

    if (!confirmed) {
      return;
    }

    startDeleting(async () => {
      const nextEditState = await deleteTerm(term.id);
      setEditState(nextEditState);

      if (!nextEditState.message) {
        setSelectedTerm(null);
        searchTerms(query || inputValue, page);
      }
    });
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      searchTerms(inputValue, 1);
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [inputValue, searchTerms]);

  return (
    <section className="rounded-lg border border-muted-background bg-surface p-6">
      <form className="space-y-5" onSubmit={submitSearch}>
        <div className="space-y-2">
          <h2 className="font-heading text-2xl font-semibold text-foreground">
            Term search
          </h2>
        </div>

        <TermSearchMessage state={state} />

        <div>
          <div className="flex-1 space-y-2">
            <label
              className="block font-sans text-sm font-bold text-foreground"
              htmlFor="moderation-term-query"
            >
              Hanzi, pinyin, zhuyin, or definition
            </label>
            <div className="flex gap-2">
              <input
                className="h-12 min-w-0 flex-1 rounded-lg border border-muted-background bg-surface px-4 font-sans text-base text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary"
                id="moderation-term-query"
                name="query"
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setInputValue(nextValue);
                  if (containsChineseSearchCharacters(nextValue)) {
                    setSearchMode("chinese");
                  }
                }}
                placeholder="Start typing here"
                type="search"
                value={inputValue}
              />
              <TermSearchModeButton mode={searchMode} onChange={setSearchMode} />
            </div>
          </div>
        </div>

        <SearchingStatus isSearching={isSearching} />
      </form>

      {hasQuery && results.length > 0 ? (
        <div className="mt-6 overflow-x-auto rounded-lg border border-muted-background">
          <div className="min-w-248">
            <div
              className={`${resultGridColumns} grid items-center gap-4 border-b border-muted-background bg-muted-background px-4 py-3 font-sans text-sm font-bold text-muted`}
            >
              <span>Term</span>
              <span>Pinyin</span>
              <span>Zhuyin</span>
              <span>Definition</span>
              <span>Verified</span>
              {canEditTerms ? <span className="text-right">Edit</span> : null}
            </div>
            <ul className="divide-y divide-muted-background">
              {results.map((term) => (
                <TermRow
                  canEditTerms={canEditTerms}
                  gridColumns={resultGridColumns}
                  key={term.id}
                  onEdit={(nextTerm) => {
                    setEditState(initialEditState);
                    setSelectedTerm(nextTerm);
                  }}
                  preferences={preferences}
                  term={term}
                />
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {hasQuery && results.length === 0 && !state.message ? (
        <p className="mt-6 rounded-lg border border-muted-background bg-background px-4 py-3 font-sans text-sm text-muted">
          No terms found.
        </p>
      ) : null}

      {hasQuery ? (
        <div className="mt-4 flex flex-col gap-3 font-sans text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <span>
            Showing {firstResult}-{lastResult} of {totalCount}
          </span>
          <div className="flex gap-2">
            <button
              className="h-10 rounded-lg border border-muted-background px-4 font-bold text-foreground transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!hasPreviousPage || isPending}
              onClick={() => searchTerms(query, page - 1)}
              type="button"
            >
              Previous
            </button>
            <button
              className="h-10 rounded-lg border border-muted-background px-4 font-bold text-foreground transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!hasNextPage || isPending}
              onClick={() => searchTerms(query, page + 1)}
              type="button"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}

      {selectedTerm ? (
        <TermEditModal
          editState={editState}
          isDeleting={isDeleting}
          isSaving={isSaving}
          onClose={() => setSelectedTerm(null)}
          onDelete={deleteSelectedTerm}
          onSubmit={editTerm}
          preferences={preferences}
          term={selectedTerm}
        />
      ) : null}
    </section>
  );
}
