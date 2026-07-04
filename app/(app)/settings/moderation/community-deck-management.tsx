"use client";

import Image from "next/image";
import {
  FormEvent,
  KeyboardEvent,
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  getChineseDisplayForms,
  type LanguagePreferences,
} from "@/lib/preferences/language";
import {
  createCommunityDeck,
  deleteCommunityDeck,
  getCommunityDeckSearchPage,
  getTermSearchPage,
  type CommunityDeckAddState,
  type CommunityDeckSearchResult,
  type CommunityDeckSearchState,
  type TermSearchResult,
  type TermSearchState,
} from "./actions";

const initialDeckState: CommunityDeckAddState = {};
const initialSearchState: TermSearchState = {
  results: [],
  query: "",
  page: 1,
  totalCount: 0,
};
const initialDeckSearchState: CommunityDeckSearchState = {
  results: [],
  query: "",
};

function DeckMessage({
  state,
}: Readonly<{ state: CommunityDeckAddState }>) {
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

function FieldInput({
  label,
  name,
  onChange,
  placeholder,
  value,
}: Readonly<{
  label: string;
  name: string;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}>) {
  return (
    <label className="space-y-2">
      <span className="block font-sans text-sm font-bold text-foreground">
        {label}
      </span>
      <input
        className="h-12 w-full rounded-lg border border-muted-background bg-surface px-4 font-sans text-base text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary"
        name={name}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required
        type="text"
        value={value}
      />
    </label>
  );
}

function FieldTextArea({
  label,
  name,
  onChange,
  placeholder,
  value,
}: Readonly<{
  label: string;
  name: string;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}>) {
  return (
    <label className="space-y-2">
      <span className="block font-sans text-sm font-bold text-foreground">
        {label}
      </span>
      <textarea
        className="min-h-28 w-full resize-y rounded-lg border border-muted-background bg-surface px-4 py-3 font-sans text-base text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary"
        name={name}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required
        value={value}
      />
    </label>
  );
}

function getTermPreview(
  term: TermSearchResult,
  preferences: LanguagePreferences,
) {
  return getChineseDisplayForms(term, preferences.characterSet).primary;
}

function SelectedTermPill({
  onRemove,
  preferences,
  term,
}: Readonly<{
  onRemove: (termId: string) => void;
  preferences: LanguagePreferences;
  term: TermSearchResult;
}>) {
  const label = getTermPreview(term, preferences);

  return (
    <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-muted-background bg-background px-3 py-2">
      <input name="termIds" type="hidden" value={term.id} />
      <span className="truncate font-chinese text-base font-bold text-foreground">
        {label}
      </span>
      <button
        aria-label={`Remove ${label}`}
        className="flex size-5 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-danger/10"
        onClick={() => onRemove(term.id)}
        type="button"
      >
        <Image
          alt=""
          className="size-2.5"
          height={10}
          src="/icons/cross.svg"
          width={10}
        />
      </button>
    </span>
  );
}

function MiniTermSearch({
  onAdd,
  preferences,
  selectedTermIds,
}: Readonly<{
  onAdd: (term: TermSearchResult) => void;
  preferences: LanguagePreferences;
  selectedTermIds: Set<string>;
}>) {
  const [state, setState] = useState<TermSearchState>(initialSearchState);
  const [inputValue, setInputValue] = useState("");
  const [isPending, startTransition] = useTransition();
  const requestId = useRef(0);
  const results = state.results ?? [];
  const query = state.query ?? "";
  const hasQuery = query.length > 0;
  const isSearching = isPending && inputValue.trim().length > 0;

  function searchTerms(nextQuery: string) {
    const currentRequestId = requestId.current + 1;
    requestId.current = currentRequestId;

    startTransition(async () => {
      const nextState = await getTermSearchPage(nextQuery, 1);

      if (requestId.current === currentRequestId) {
        setState(nextState);
      }
    });
  }

  function submitSearch(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    searchTerms(inputValue);
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      searchTerms(inputValue);
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [inputValue]);

  return (
    <div className="space-y-3">
      <label className="space-y-2">
        <span className="block font-sans text-sm font-bold text-foreground">
          Add terms
        </span>
        <input
          className="h-12 w-full rounded-lg border border-muted-background bg-surface px-4 font-sans text-base text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary"
          onChange={(event) => setInputValue(event.target.value)}
          onKeyDown={submitSearch}
          placeholder="Search hanzi, pinyin, or zhuyin"
          type="search"
          value={inputValue}
        />
      </label>

      {isSearching ? (
        <p
          aria-live="polite"
          className="font-sans text-sm font-bold text-primary"
        >
          Searching...
        </p>
      ) : null}

      {state.message ? (
        <p className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 font-sans text-sm font-bold text-danger">
          {state.message}
        </p>
      ) : null}

      {hasQuery && results.length > 0 ? (
        <ul className="max-h-72 divide-y divide-muted-background overflow-y-auto rounded-lg border border-muted-background">
          {results.slice(0, 8).map((term) => {
            const isSelected = selectedTermIds.has(term.id);
            const label = getTermPreview(term, preferences);

            return (
              <li
                className="grid gap-3 px-4 py-3 font-sans text-sm sm:grid-cols-[minmax(5rem,0.65fr)_minmax(8rem,1fr)_auto] sm:items-center"
                key={term.id}
              >
                <span className="truncate font-chinese text-xl font-bold text-foreground">
                  {label}
                </span>
                <span className="min-w-0 truncate text-muted">
                  {term.pinyin}
                </span>
                <button
                  className="h-9 w-full rounded-lg border border-muted-background px-3 font-sans text-xs font-bold text-foreground transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  disabled={isSelected}
                  onClick={() => onAdd(term)}
                  type="button"
                >
                  {isSelected ? "Added" : "Add"}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {hasQuery && results.length === 0 && !state.message ? (
        <p className="rounded-lg border border-muted-background bg-background px-4 py-3 font-sans text-sm text-muted">
          No terms found.
        </p>
      ) : null}
    </div>
  );
}

function DeckDeleteMessage({
  state,
}: Readonly<{ state: CommunityDeckSearchState }>) {
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

function CommunityDeckRow({
  deck,
  isDeleting,
  onDelete,
}: Readonly<{
  deck: CommunityDeckSearchResult;
  isDeleting: boolean;
  onDelete: (deck: CommunityDeckSearchResult) => void;
}>) {
  return (
    <li className="grid gap-3 px-4 py-4 font-sans text-sm sm:grid-cols-[minmax(12rem,1fr)_minmax(12rem,1.2fr)_8rem_6rem] sm:items-center">
      <div className="min-w-0">
        <p className="truncate font-bold text-foreground">{deck.title}</p>
        <p className="truncate text-xs text-muted">
          Created by {deck.created_by || "Jingdex"}
        </p>
      </div>
      <p className="min-w-0 truncate text-muted">
        {deck.description || "No description"}
      </p>
      <span className="whitespace-nowrap text-muted">
        {deck.publication_status}
      </span>
      <button
        className="h-9 rounded-lg border border-danger/40 px-3 font-sans text-xs font-bold text-danger transition-colors hover:border-danger hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={isDeleting}
        onClick={() => onDelete(deck)}
        type="button"
      >
        {isDeleting ? "Deleting" : "Delete"}
      </button>
    </li>
  );
}

function CommunityDeckDeletion() {
  const [state, setState] =
    useState<CommunityDeckSearchState>(initialDeckSearchState);
  const [inputValue, setInputValue] = useState("");
  const [isPending, startTransition] = useTransition();
  const [deletingDeckId, setDeletingDeckId] = useState<string | null>(null);
  const requestId = useRef(0);
  const results = state.results ?? [];
  const query = state.query ?? "";
  const hasQuery = query.length > 0;
  const isSearching = isPending && inputValue.trim().length > 0;

  function searchDecks(nextQuery: string) {
    const currentRequestId = requestId.current + 1;
    requestId.current = currentRequestId;

    startTransition(async () => {
      const nextState = await getCommunityDeckSearchPage(nextQuery);

      if (requestId.current === currentRequestId) {
        setState(nextState);
      }
    });
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    searchDecks(inputValue);
  }

  function removeDeck(deck: CommunityDeckSearchResult) {
    const confirmed = window.confirm(
      `Delete ${deck.title}? This will also remove its deck terms.`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingDeckId(deck.id);
    startTransition(async () => {
      const deleteState = await deleteCommunityDeck(deck.id);
      const nextSearchState = await getCommunityDeckSearchPage(query);

      setDeletingDeckId(null);
      setState({
        ...nextSearchState,
        message: deleteState.message,
        success: deleteState.success,
      });
    });
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      searchDecks(inputValue);
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [inputValue]);

  return (
    <section className="rounded-lg border border-muted-background bg-surface p-6">
      <form className="space-y-5" onSubmit={submitSearch}>
        <div className="space-y-2">
          <h2 className="font-heading text-2xl font-semibold text-foreground">
            Community deck deletion
          </h2>
        </div>

        <DeckDeleteMessage state={state} />

        <label className="space-y-2">
          <span className="block font-sans text-sm font-bold text-foreground">
            Deck name
          </span>
          <input
            className="h-12 w-full rounded-lg border border-muted-background bg-surface px-4 font-sans text-base text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary"
            onChange={(event) => setInputValue(event.target.value)}
            placeholder="Search community decks"
            type="search"
            value={inputValue}
          />
        </label>

        {isSearching ? (
          <p
            aria-live="polite"
            className="font-sans text-sm font-bold text-primary"
          >
            Searching...
          </p>
        ) : null}
      </form>

      {hasQuery && results.length > 0 ? (
        <div className="mt-6 overflow-x-auto rounded-lg border border-muted-background">
          <div className="min-w-192">
            <div className="grid grid-cols-[minmax(12rem,1fr)_minmax(12rem,1.2fr)_8rem_6rem] items-center gap-3 border-b border-muted-background bg-muted-background px-4 py-3 font-sans text-sm font-bold text-muted">
              <span>Deck</span>
              <span>Description</span>
              <span>Status</span>
              <span>Delete</span>
            </div>
            <ul className="divide-y divide-muted-background">
              {results.map((deck) => (
                <CommunityDeckRow
                  deck={deck}
                  isDeleting={deletingDeckId === deck.id}
                  key={deck.id}
                  onDelete={removeDeck}
                />
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {hasQuery && results.length === 0 && !state.message ? (
        <p className="mt-6 rounded-lg border border-muted-background bg-background px-4 py-3 font-sans text-sm text-muted">
          No community decks found.
        </p>
      ) : null}
    </section>
  );
}

export function CommunityDeckManagement({
  preferences,
}: Readonly<{
  preferences: LanguagePreferences;
}>) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTerms, setSelectedTerms] = useState<TermSearchResult[]>([]);
  const [state, action, isPublishing] = useActionState(
    async (previousState: CommunityDeckAddState, formData: FormData) => {
      const nextState = await createCommunityDeck(previousState, formData);

      if (nextState.success) {
        setTitle("");
        setDescription("");
        setSelectedTerms([]);
      }

      return nextState;
    },
    initialDeckState,
  );
  const selectedTermIds = new Set(selectedTerms.map((term) => term.id));

  function addTerm(term: TermSearchResult) {
    setSelectedTerms((currentTerms) =>
      currentTerms.some((currentTerm) => currentTerm.id === term.id)
        ? currentTerms
        : [...currentTerms, term],
    );
  }

  function removeTerm(termId: string) {
    setSelectedTerms((currentTerms) =>
      currentTerms.filter((term) => term.id !== termId),
    );
  }

  return (
    <>
      <section className="rounded-lg border border-muted-background bg-surface p-6">
        <div className="space-y-2">
          <h2 className="font-heading text-2xl font-semibold text-foreground">
            Community deck publishing
          </h2>
        </div>

        <form action={action} className="mt-5 space-y-5">
          <DeckMessage state={state} />

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.8fr)]">
            <div className="space-y-4">
              <FieldInput
                label="Title"
                name="title"
                onChange={setTitle}
                placeholder="HSK 1 essentials"
                value={title}
              />
              <FieldTextArea
                label="Description"
                name="description"
                onChange={setDescription}
                placeholder="A focused deck for early vocabulary review."
                value={description}
              />
            </div>

            <MiniTermSearch
              onAdd={addTerm}
              preferences={preferences}
              selectedTermIds={selectedTermIds}
            />
          </div>

          <div className="space-y-3">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <h3 className="font-heading text-xl font-semibold text-foreground">
                Terms
              </h3>
              <span className="font-sans text-sm font-bold text-muted">
                {selectedTerms.length} selected
              </span>
            </div>

            {selectedTerms.length > 0 ? (
              <div className="flex max-h-44 flex-wrap gap-2 overflow-y-auto rounded-lg border border-muted-background bg-surface p-3">
                {selectedTerms.map((term) => (
                  <SelectedTermPill
                    key={term.id}
                    onRemove={removeTerm}
                    preferences={preferences}
                    term={term}
                  />
                ))}
              </div>
            ) : (
              <p className="rounded-lg border border-muted-background bg-background px-4 py-3 font-sans text-sm text-muted">
                Search for terms and add them to build the deck.
              </p>
            )}
          </div>

          <button
            className="h-12 rounded-lg bg-primary px-5 font-sans text-sm font-bold text-text-light transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isPublishing}
            type="submit"
          >
            {isPublishing ? "Publishing" : "Publish deck"}
          </button>
        </form>
      </section>

      <CommunityDeckDeletion />
    </>
  );
}
