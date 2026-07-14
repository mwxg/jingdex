"use client";

import Image from "next/image";
import {
  FormEvent,
  KeyboardEvent,
  useActionState,
  useCallback,
  useEffect,
  useId,
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
  updateCommunityDeck,
  type CommunityDeckAddState,
  type CommunityDeckSearchResult,
  type CommunityDeckSearchState,
  type CommunityDeckEditState,
  type TermSearchResult,
  type TermSearchState,
} from "./actions";
import { TermSearchModeButton } from "@/components/term-search-mode-button";
import { InlineLoadingStatus } from "@/components/loading";
import {
  containsChineseSearchCharacters,
  type TermSearchMode,
} from "@/lib/terms/search-mode";

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
const initialDeckEditState: CommunityDeckEditState = {};

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

function ReorderableTerms({
  onChange,
  preferences,
  terms,
}: Readonly<{
  onChange: (terms: TermSearchResult[]) => void;
  preferences: LanguagePreferences;
  terms: TermSearchResult[];
}>) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  function move(from: number, to: number) {
    if (to < 0 || to >= terms.length || from === to) return;
    const next = [...terms];
    const [term] = next.splice(from, 1);
    next.splice(to, 0, term);
    onChange(next);
  }

  return (
    <ol className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-muted-background p-3">
      {terms.map((term, index) => {
        const label = getTermPreview(term, preferences);
        const definition = term.short_definition || term.english_definition?.split(/\r?\n/, 1)[0] || "No definition added.";
        return (
          <li
            className="flex items-center gap-2 rounded-lg bg-background px-3 py-2"
            draggable
            key={term.id}
            onDragEnd={() => setDraggedIndex(null)}
            onDragOver={(event) => event.preventDefault()}
            onDragStart={() => setDraggedIndex(index)}
            onDrop={() => {
              if (draggedIndex !== null) move(draggedIndex, index);
              setDraggedIndex(null);
            }}
          >
            <input name="termIds" type="hidden" value={term.id} />
            <span aria-hidden="true" className="cursor-grab select-none text-lg font-bold text-muted">⋮⋮</span>
            <span className="min-w-0 flex-1 truncate font-chinese text-base font-bold text-foreground">{label}</span>
            <span className="hidden max-w-48 truncate font-sans text-xs text-muted sm:block">{definition}</span>
            <button aria-label={`Move ${label} up`} className="size-7 rounded text-sm font-bold text-muted hover:bg-muted-background disabled:opacity-30" disabled={index === 0} onClick={() => move(index, index - 1)} type="button">↑</button>
            <button aria-label={`Move ${label} down`} className="size-7 rounded text-sm font-bold text-muted hover:bg-muted-background disabled:opacity-30" disabled={index === terms.length - 1} onClick={() => move(index, index + 1)} type="button">↓</button>
            <button
              aria-label={`Remove ${label}`}
              className="flex size-5 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-danger/10"
              onClick={() => onChange(terms.filter((item) => item.id !== term.id))}
              type="button"
            >
              <Image alt="" className="size-2.5" height={10} src="/icons/cross.svg" width={10} />
            </button>
          </li>
        );
      })}
    </ol>
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
  const [searchMode, setSearchMode] = useState<TermSearchMode>("all");
  const [isPending, startTransition] = useTransition();
  const inputId = useId();
  const requestId = useRef(0);
  const results = state.results ?? [];
  const query = state.query ?? "";
  const hasQuery = query.length > 0;
  const isSearching = isPending && inputValue.trim().length > 0;

  const searchTerms = useCallback(
    (nextQuery: string) => {
      const currentRequestId = requestId.current + 1;
      requestId.current = currentRequestId;

      startTransition(async () => {
        const nextState = await getTermSearchPage(nextQuery, 1, searchMode);

        if (requestId.current === currentRequestId) {
          setState(nextState);
        }
      });
    },
    [searchMode],
  );

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
  }, [inputValue, searchTerms]);

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <label
          className="block font-sans text-sm font-bold text-foreground"
          htmlFor={inputId}
        >
          Add terms
        </label>
        <div className="flex gap-2">
          <input
            className="h-12 min-w-0 flex-1 rounded-lg border border-muted-background bg-surface px-4 font-sans text-base text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary"
            id={inputId}
            onChange={(event) => {
              const nextValue = event.target.value;
              setInputValue(nextValue);
              if (containsChineseSearchCharacters(nextValue)) {
                setSearchMode("chinese");
              }
            }}
            onKeyDown={submitSearch}
            placeholder="Search hanzi, pinyin, zhuyin, or definition"
            type="search"
            value={inputValue}
          />
          <TermSearchModeButton mode={searchMode} onChange={setSearchMode} />
        </div>
      </div>

      {isSearching ? <InlineLoadingStatus label="Searching…" /> : null}

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
  onEdit,
}: Readonly<{
  deck: CommunityDeckSearchResult;
  onEdit: (deck: CommunityDeckSearchResult) => void;
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
        className="h-9 rounded-lg border border-muted-background px-3 font-sans text-xs font-bold text-foreground transition-colors hover:border-primary hover:text-primary"
        onClick={() => onEdit(deck)}
        type="button"
      >
        Edit
      </button>
    </li>
  );
}

function CommunityDeckEditModal({
  deck,
  editState,
  isDeleting,
  isSaving,
  onClose,
  onDelete,
  onSubmit,
  preferences,
}: Readonly<{
  deck: CommunityDeckSearchResult;
  editState: CommunityDeckEditState;
  isDeleting: boolean;
  isSaving: boolean;
  onClose: () => void;
  onDelete: (deck: CommunityDeckSearchResult) => void;
  onSubmit: (formData: FormData) => void;
  preferences: LanguagePreferences;
}>) {
  const [title, setTitle] = useState(deck.title);
  const [description, setDescription] = useState(deck.description ?? "");
  const [publicationStatus, setPublicationStatus] = useState(deck.publication_status);
  const [reviewerNotes, setReviewerNotes] = useState(deck.review_notes ?? "");
  const [selectedTerms, setSelectedTerms] = useState(deck.terms);
  const selectedTermIds = new Set(selectedTerms.map((term) => term.id));

  return (
    <div aria-labelledby="deck-edit-title" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 px-4 py-6" role="dialog">
      <div className="max-h-full w-full max-w-3xl overflow-y-auto rounded-lg border border-muted-background bg-surface p-6 shadow-lg">
        <h2 id="deck-edit-title" className="font-heading text-2xl font-semibold text-foreground">Edit community deck</h2>
        <p className="mt-1 font-sans text-sm text-muted">Created by <span className="font-bold text-foreground">{deck.created_by || "Jingdex"}</span></p>
        <form action={onSubmit} className="mt-5 space-y-5">
          <input name="deckId" type="hidden" value={deck.id} />
          <DeckMessage state={editState} />
          <FieldInput label="Title" name="title" onChange={setTitle} placeholder="Deck title" value={title} />
          <FieldTextArea label="Description" name="description" onChange={setDescription} placeholder="Deck description" value={description} />
          <label className="space-y-2">
            <span className="block font-sans text-sm font-bold text-foreground">Publication status</span>
            <select className="h-12 w-full rounded-lg border border-muted-background bg-surface px-4 font-sans text-base text-foreground outline-none focus:border-primary" name="publicationStatus" onChange={(event) => setPublicationStatus(event.target.value)} value={publicationStatus}>
              <option value="draft">Draft</option><option value="under_review">Under review</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="archived">Archived</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="block font-sans text-sm font-bold text-foreground">Reviewer notes <span className="font-normal text-muted">(required when rejecting)</span></span>
            <textarea className="min-h-28 w-full resize-y rounded-lg border border-muted-background bg-surface px-4 py-3 font-sans text-base text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary" name="reviewerNotes" onChange={(event) => setReviewerNotes(event.target.value)} placeholder="Explain the review decision" required={publicationStatus === "rejected"} value={reviewerNotes} />
          </label>
          <MiniTermSearch onAdd={(term) => setSelectedTerms((terms) => terms.some((item) => item.id === term.id) ? terms : [...terms, term])} preferences={preferences} selectedTermIds={selectedTermIds} />
          <div className="space-y-2">
            <span className="font-sans text-sm font-bold text-foreground">Terms ({selectedTerms.length})</span>
            <ReorderableTerms onChange={setSelectedTerms} preferences={preferences} terms={selectedTerms} />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button className="h-10 rounded-lg border border-danger/40 px-4 font-sans text-sm font-bold text-danger hover:border-danger hover:bg-danger/10 disabled:opacity-50" disabled={isDeleting || isSaving} onClick={() => onDelete(deck)} type="button">{isDeleting ? "Deleting" : "Delete"}</button>
            <div className="flex justify-end gap-2">
              <button className="h-10 rounded-lg border border-muted-background px-4 font-sans text-sm font-bold text-foreground hover:border-primary hover:text-primary" disabled={isDeleting || isSaving} onClick={onClose} type="button">Cancel</button>
              <button className="h-10 rounded-lg bg-primary px-4 font-sans text-sm font-bold text-on-primary disabled:opacity-50" disabled={isDeleting || isSaving} type="submit">{isSaving ? "Saving" : "Save"}</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function CommunityDeckEditing({ preferences }: Readonly<{ preferences: LanguagePreferences }>) {
  const [state, setState] =
    useState<CommunityDeckSearchState>(initialDeckSearchState);
  const [inputValue, setInputValue] = useState("");
  const [isPending, startTransition] = useTransition();
  const [selectedDeck, setSelectedDeck] = useState<CommunityDeckSearchResult | null>(null);
  const [editState, setEditState] = useState<CommunityDeckEditState>(initialDeckEditState);
  const [isDeleting, startDeleting] = useTransition();
  const [isSaving, startSaving] = useTransition();
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

    startDeleting(async () => {
      const deleteState = await deleteCommunityDeck(deck.id);
      const nextSearchState = await getCommunityDeckSearchPage(query);
      if (!deleteState.message) setSelectedDeck(null);
      setState({
        ...nextSearchState,
        message: deleteState.message,
        success: deleteState.success,
      });
    });
  }

  function editDeck(formData: FormData) {
    startSaving(async () => {
      const nextEditState = await updateCommunityDeck(formData);
      setEditState(nextEditState);
      if (!nextEditState.message) {
        setSelectedDeck(null);
        const nextSearchState = await getCommunityDeckSearchPage(query || inputValue);
        setState({ ...nextSearchState, success: nextEditState.success });
      }
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
            Community deck management
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

        {isSearching ? <InlineLoadingStatus label="Searching…" /> : null}
      </form>

      {hasQuery && results.length > 0 ? (
        <div className="mt-6 overflow-x-auto rounded-lg border border-muted-background">
          <div className="min-w-3xl">
            <div className="grid grid-cols-[minmax(12rem,1fr)_minmax(12rem,1.2fr)_8rem_6rem] items-center gap-3 border-b border-muted-background bg-muted-background px-4 py-3 font-sans text-sm font-bold text-muted">
              <span>Deck</span>
              <span>Description</span>
              <span>Status</span>
              <span>Edit</span>
            </div>
            <ul className="divide-y divide-muted-background">
              {results.map((deck) => (
                <CommunityDeckRow
                  deck={deck}
                  key={deck.id}
                  onEdit={(nextDeck) => { setEditState(initialDeckEditState); setSelectedDeck(nextDeck); }}
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
      {selectedDeck ? <CommunityDeckEditModal deck={selectedDeck} editState={editState} isDeleting={isDeleting} isSaving={isSaving} onClose={() => setSelectedDeck(null)} onDelete={removeDeck} onSubmit={editDeck} preferences={preferences} /> : null}
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
              <ReorderableTerms onChange={setSelectedTerms} preferences={preferences} terms={selectedTerms} />
            ) : (
              <p className="rounded-lg border border-muted-background bg-background px-4 py-3 font-sans text-sm text-muted">
                Search for terms and add them to build the deck.
              </p>
            )}
          </div>

          <button
            className="h-12 rounded-lg bg-primary px-5 font-sans text-sm font-bold text-on-primary transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isPublishing}
            type="submit"
          >
            {isPublishing ? "Publishing" : "Publish deck"}
          </button>
        </form>
      </section>

      <CommunityDeckEditing preferences={preferences} />
    </>
  );
}
