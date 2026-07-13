"use client";

import Image from "next/image";
import { useActionState, useEffect, useId, useRef, useState, useTransition } from "react";
import { createDeck, deleteDeck, updateDeck, type DeckActionState } from "./actions";
import { searchDictionary, type DictionaryTerm } from "@/app/(app)/dictionary/actions";
import { getChineseDisplayForms, type LanguagePreferences } from "@/lib/preferences/language";

export type PersonalDeck = {
  id: string;
  title: string;
  description: string | null;
  updated_at: string;
  deck_terms: { count: number }[];
};

const initialState: DeckActionState = {};
const field = "h-12 w-full rounded-lg border border-muted-background bg-surface px-4 font-sans text-base text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary";

function getDefinitionPreview(term: DictionaryTerm) {
  const definition = term.short_definition || term.english_definition?.split(/\r?\n/, 1)[0] || "No definition added.";
  return definition.length <= 150 ? definition : `${definition.slice(0, 150).trim()}...`;
}

function Message({ state }: { state: DeckActionState }) {
  if (!state.message && !state.success) return null;
  return <p role="status" className={`rounded-lg border px-4 py-3 text-sm font-bold ${state.message ? "border-danger/30 bg-danger/10 text-danger" : "border-confirm/30 bg-confirm/10 text-confirm"}`}>{state.message || state.success}</p>;
}

function DeckEditor({ deck }: { deck: PersonalDeck }) {
  const [editing, setEditing] = useState(false);
  const [updateState, updateAction, updating] = useActionState(updateDeck, initialState);
  const [deleteState, deleteAction, deleting] = useActionState(deleteDeck, initialState);
  const termCount = deck.deck_terms?.[0]?.count ?? 0;

  return <li className="rounded-lg border border-muted-background bg-surface p-5">
    {editing ? <form action={updateAction} className="space-y-4">
      <input name="id" type="hidden" value={deck.id} />
      <label className="block space-y-2"><span className="text-sm font-bold">Deck title</span><input className={field} defaultValue={deck.title} maxLength={100} name="title" required /></label>
      <label className="block space-y-2"><span className="text-sm font-bold">Description <span className="font-normal text-muted">(optional)</span></span><textarea className={`${field} min-h-28 py-3`} defaultValue={deck.description ?? ""} maxLength={500} name="description" /></label>
      <Message state={updateState} />
      <div className="flex flex-wrap gap-3"><button className="h-11 rounded-lg bg-primary px-5 text-sm font-bold text-text-light disabled:opacity-60" disabled={updating} type="submit">{updating ? "Saving…" : "Save changes"}</button><button className="h-11 rounded-lg border border-muted-background px-5 text-sm font-bold hover:border-primary" onClick={() => setEditing(false)} type="button">Cancel</button></div>
    </form> : <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0"><h2 className="font-heading text-2xl font-semibold">{deck.title}</h2><p className="mt-2 text-sm leading-6 text-muted">{deck.description || "No description added."}</p></div>
        <span className="w-fit shrink-0 rounded-full bg-muted-background px-3 py-1 text-xs font-bold text-muted">{termCount} {termCount === 1 ? "term" : "terms"}</span>
      </div>
      <div className="mt-5 flex flex-wrap gap-3 border-t border-muted-background pt-4">
        <button className="h-10 rounded-lg border border-muted-background px-4 text-sm font-bold hover:border-primary hover:text-primary" onClick={() => setEditing(true)} type="button">Edit details</button>
        <form action={deleteAction} onSubmit={(event) => { if (!window.confirm(`Delete “${deck.title}”? This cannot be undone.`)) event.preventDefault(); }}><input name="id" type="hidden" value={deck.id} /><button className="h-10 rounded-lg border border-danger/30 px-4 text-sm font-bold text-danger hover:bg-danger/10 disabled:opacity-60" disabled={deleting} type="submit">{deleting ? "Deleting…" : "Delete"}</button></form>
      </div>
      <Message state={deleteState} />
    </>}
  </li>;
}

function TermPicker({ preferences, selected, setSelected }: {
  preferences: LanguagePreferences;
  selected: DictionaryTerm[];
  setSelected: React.Dispatch<React.SetStateAction<DictionaryTerm[]>>;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DictionaryTerm[]>([]);
  const [message, setMessage] = useState<string>();
  const [searching, startSearching] = useTransition();
  const inputId = useId();
  const requestId = useRef(0);
  const selectedIds = new Set(selected.map((term) => term.id));

  useEffect(() => {
    const currentId = ++requestId.current;
    const timeout = window.setTimeout(() => {
      if (!query.trim()) { setResults([]); setMessage(undefined); return; }
      startSearching(async () => {
        const state = await searchDictionary(query);
        if (requestId.current === currentId) { setResults(state.results.slice(0, 8)); setMessage(state.message); }
      });
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [query]);

  return <div className="space-y-3">
    <label className="block space-y-2" htmlFor={inputId}><span className="text-sm font-bold">Add terms</span><input className={field} id={inputId} onChange={(event) => setQuery(event.target.value)} placeholder="Search hanzi, pinyin, zhuyin, or definition" type="search" value={query} /></label>
    {searching && query.trim() ? <p aria-live="polite" className="text-sm font-bold text-primary">Searching…</p> : null}
    {message ? <p className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm font-bold text-danger">{message}</p> : null}
    {query.trim() && results.length ? <ul className="max-h-72 divide-y divide-muted-background overflow-y-auto rounded-lg border border-muted-background">{results.map((term) => {
      const forms = getChineseDisplayForms(term, preferences.characterSet);
      const pronunciation = preferences.pronunciation === "zhuyin" ? term.zhuyin : term.pinyin;
      return <li className="grid gap-2 px-4 py-3 sm:grid-cols-[minmax(5rem,.55fr)_minmax(7rem,.7fr)_minmax(10rem,1.3fr)_auto] sm:items-center" key={term.id}><span className="truncate font-chinese text-xl font-bold">{forms.primary}</span><span className="truncate text-sm text-muted">{pronunciation}</span><span className="line-clamp-2 text-sm text-foreground">{getDefinitionPreview(term)}</span><button className="h-9 rounded-lg border border-muted-background px-3 text-xs font-bold hover:border-primary hover:text-primary disabled:opacity-50" disabled={selectedIds.has(term.id)} onClick={() => setSelected((items) => items.some((item) => item.id === term.id) ? items : [...items, term])} type="button">{selectedIds.has(term.id) ? "Added" : "Add"}</button></li>;
    })}</ul> : null}
    {query.trim() && !searching && !results.length && !message ? <p className="rounded-lg border border-muted-background bg-background px-4 py-3 text-sm text-muted">No terms found.</p> : null}
    <div className="space-y-2"><p className="text-sm font-bold">Terms ({selected.length})</p>{selected.length ? <div className="flex max-h-44 flex-wrap gap-2 overflow-y-auto rounded-lg border border-muted-background p-3">{selected.map((term) => {
      const label = getChineseDisplayForms(term, preferences.characterSet).primary;
      return <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-muted-background bg-background px-3 py-2" key={term.id}><input name="termIds" type="hidden" value={term.id} /><span className="truncate font-chinese font-bold">{label}</span><button aria-label={`Remove ${label}`} className="flex size-5 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-danger/10" onClick={() => setSelected((items) => items.filter((item) => item.id !== term.id))} type="button"><Image alt="" className="size-2.5" height={10} src="/icons/cross.svg" width={10} /></button></span>;
    })}</div> : <p className="rounded-lg border border-muted-background bg-background px-4 py-3 text-sm text-muted">Add at least one term before creating this deck.</p>}</div>
  </div>;
}

export function DeckManager({ decks, preferences }: { decks: PersonalDeck[]; preferences: LanguagePreferences }) {
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTerms, setSelectedTerms] = useState<DictionaryTerm[]>([]);
  const [state, action, pending] = useActionState(async (previous: DeckActionState, formData: FormData) => {
    const next = await createDeck(previous, formData);
    if (next.success) { setSelectedTerms([]); setShowCreate(false); }
    return next;
  }, initialState);
  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="font-heading text-3xl font-semibold">Personal decks</h2><p className="mt-1 text-sm text-muted">Private to your account and separate from community decks.</p></div><button className="h-11 rounded-lg bg-primary px-5 text-sm font-bold text-text-light hover:bg-primary/90" onClick={() => setShowCreate((value) => !value)} type="button">{showCreate ? "Close" : "Create deck"}</button></div>
    {showCreate && <form action={action} className="space-y-4 rounded-lg border border-muted-background bg-surface p-5 sm:p-6">
      <h2 className="font-heading text-2xl font-semibold">Create a private deck</h2>
      <label className="block space-y-2"><span className="text-sm font-bold">Deck title</span><input autoFocus className={field} maxLength={100} name="title" placeholder="Food and restaurants" required /></label>
      <label className="block space-y-2"><span className="text-sm font-bold">Description <span className="font-normal text-muted">(optional)</span></span><textarea className={`${field} min-h-28 py-3`} maxLength={500} name="description" placeholder="Words I want to practice before my trip." /></label>
      <TermPicker preferences={preferences} selected={selectedTerms} setSelected={setSelectedTerms} />
      <Message state={state} /><button className="h-11 rounded-lg bg-confirm px-5 text-sm font-bold text-text-light disabled:opacity-60" disabled={pending || selectedTerms.length === 0} type="submit">{pending ? "Creating…" : "Create deck"}</button>
    </form>}
    {decks.length ? <ul className="grid gap-4 lg:grid-cols-2">{decks.map((deck) => <DeckEditor deck={deck} key={deck.id} />)}</ul> : <div className="rounded-lg border border-muted-background bg-surface p-6 text-muted"><p className="font-bold text-foreground">No personal decks yet</p><p className="mt-2 text-sm leading-6">Create your first private deck to start organizing vocabulary.</p></div>}
  </div>;
}
