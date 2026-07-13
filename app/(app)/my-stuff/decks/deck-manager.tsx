"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useEffect, useId, useRef, useState, useTransition } from "react";
import { createDeck, deleteDeck, submitDeckForReview, updateDeck, updateDeckTerms, type DeckActionState } from "./actions";
import { searchDictionary, type DictionaryTerm } from "@/app/(app)/dictionary/actions";
import { getChineseDisplayForms, type LanguagePreferences } from "@/lib/preferences/language";
import { type CommunityTerm } from "@/app/(app)/community/data";

export type PersonalDeck = {
  id: string;
  title: string;
  description: string | null;
  updated_at: string;
  created_by: string;
  created_at: string;
  term_count: number;
  first_term: CommunityTerm | null;
  terms: DictionaryTerm[];
  visibility: "private" | "unlisted" | "moderators" | "community";
  publication_status: "draft" | "under_review" | "approved" | "rejected" | "archived";
  review_notes: string | null;
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

function DeckEditor({ deck, preferences }: { deck: PersonalDeck; preferences: LanguagePreferences }) {
  const [editing, setEditing] = useState(false);
  const [editingTerms, setEditingTerms] = useState(false);
  const [updateState, updateAction, updating] = useActionState(updateDeck, initialState);
  const [deleteState, deleteAction, deleting] = useActionState(deleteDeck, initialState);
  const [submitState, submitAction, submitting] = useActionState(submitDeckForReview, initialState);
  const termCount = deck.term_count;
  const forms = deck.first_term ? getChineseDisplayForms(deck.first_term, preferences.characterSet) : null;
  const isPublished = deck.publication_status === "approved";
  const canEdit = deck.visibility === "private" && deck.publication_status !== "approved";
  const canSubmit = canEdit && ["draft", "rejected"].includes(deck.publication_status);
  const hasDescription = Boolean(deck.description?.trim());
  const statusLabel = {
    draft: "Private draft",
    under_review: "Under review",
    approved: "Published",
    rejected: "Changes requested",
    archived: "Archived",
  }[deck.publication_status];

  return <li className={`rounded-lg border bg-surface p-5 transition-colors ${isPublished ? "border-[color:color-mix(in_srgb,var(--community-deck)_35%,transparent)] hover:border-[var(--community-deck)]" : "border-muted-background hover:border-primary"}`}>
    {editing ? <form action={updateAction} className="space-y-4">
      <input name="id" type="hidden" value={deck.id} />
      <label className="block space-y-2"><span className="text-sm font-bold">Deck title</span><input className={field} defaultValue={deck.title} maxLength={100} name="title" required /></label>
      <label className="block space-y-2"><span className="text-sm font-bold">Description <span className="font-normal text-muted">(optional)</span></span><textarea className={`${field} min-h-28 py-3`} defaultValue={deck.description ?? ""} maxLength={500} name="description" /></label>
      <Message state={updateState} />
      <div className="flex flex-wrap gap-3"><button className="h-11 rounded-lg bg-primary px-5 text-sm font-bold text-text-light disabled:opacity-60" disabled={updating} type="submit">{updating ? "Saving…" : "Save changes"}</button><button className="h-11 rounded-lg border border-muted-background px-5 text-sm font-bold hover:border-primary" onClick={() => setEditing(false)} type="button">Cancel</button></div>
    </form> : <>
      <Link className={`block rounded-lg focus:outline-none focus-visible:ring-2 ${isPublished ? "focus-visible:ring-[var(--community-deck)]" : "focus-visible:ring-primary"}`} href={`/my-stuff/decks/${deck.id}`}>
        <div className={`flex min-h-40 items-center justify-center rounded-lg px-4 py-6 ${isPublished ? "bg-[color:color-mix(in_srgb,var(--community-deck)_9%,var(--surface))]" : "bg-muted-background"}`}>
          {forms ? <p className="text-center font-chinese text-6xl font-bold leading-none text-foreground sm:text-7xl">{forms.primary}</p> : <p className="text-sm font-bold text-muted">Empty deck</p>}
        </div>
        <div className="mt-5 space-y-3">
          <h2 className="line-clamp-2 font-heading text-2xl font-semibold leading-tight">{deck.title}</h2>
          <p className="line-clamp-3 min-h-18 text-sm leading-6 text-muted">{deck.description || "No description added."}</p>
          <div className={`flex items-center justify-between gap-3 border-t pt-3 text-sm ${isPublished ? "border-[color:color-mix(in_srgb,var(--community-deck)_20%,transparent)] text-muted" : "border-muted-background text-muted"}`}><span>{termCount} {termCount === 1 ? "term" : "terms"}</span><span className={isPublished ? "font-bold text-[var(--community-deck)]" : undefined}>{statusLabel}</span></div>
        </div>
      </Link>
      {deck.review_notes ? <p className="mt-4 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"><span className="font-bold">Reviewer notes:</span> {deck.review_notes}</p> : null}
      {canEdit ? <div className="mt-5 flex flex-wrap gap-3 border-t border-muted-background pt-4">
        <button className="h-10 rounded-lg border border-muted-background px-4 text-sm font-bold hover:border-primary hover:text-primary" onClick={() => setEditing(true)} type="button">Edit details</button>
        <button className="h-10 rounded-lg border border-muted-background px-4 text-sm font-bold hover:border-primary hover:text-primary" onClick={() => setEditingTerms(true)} type="button">Edit terms</button>
        {canSubmit ? <form action={submitAction}><input name="id" type="hidden" value={deck.id} /><button className="h-10 rounded-lg bg-confirm px-4 text-sm font-bold text-text-light disabled:cursor-not-allowed disabled:opacity-60" disabled={submitting || !hasDescription || termCount === 0} title={!hasDescription ? "Add a description before submitting" : undefined} type="submit">{submitting ? "Submitting…" : deck.publication_status === "rejected" ? "Resubmit for review" : "Submit for review"}</button></form> : null}
        <form action={deleteAction} onSubmit={(event) => { if (!window.confirm(`Delete “${deck.title}”? This cannot be undone.`)) event.preventDefault(); }}><input name="id" type="hidden" value={deck.id} /><button className="h-10 rounded-lg border border-danger/30 px-4 text-sm font-bold text-danger hover:bg-danger/10 disabled:opacity-60" disabled={deleting} type="submit">{deleting ? "Deleting…" : "Delete"}</button></form>
      </div> : null}
      {canSubmit && !hasDescription ? <p className="mt-3 text-sm font-bold text-muted">Add a description before submitting this deck for review.</p> : null}
      <Message state={submitState} />
      <Message state={deleteState} />
    </>}
    {editingTerms ? <EditTermsModal deck={deck} onClose={() => setEditingTerms(false)} preferences={preferences} /> : null}
  </li>;
}

function ReorderableTerms({ preferences, selected, setSelected }: {
  preferences: LanguagePreferences;
  selected: DictionaryTerm[];
  setSelected: React.Dispatch<React.SetStateAction<DictionaryTerm[]>>;
}) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  function move(from: number, to: number) {
    if (to < 0 || to >= selected.length || from === to) return;
    setSelected((items) => { const next = [...items]; const [item] = next.splice(from, 1); next.splice(to, 0, item); return next; });
  }
  return selected.length ? <ol className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-muted-background p-3">{selected.map((term, index) => {
    const label = getChineseDisplayForms(term, preferences.characterSet).primary;
    return <li className="flex items-center gap-2 rounded-lg bg-background px-3 py-2" draggable key={term.id}
      onDragEnd={() => setDraggedIndex(null)} onDragOver={(event) => event.preventDefault()}
      onDragStart={() => setDraggedIndex(index)} onDrop={() => { if (draggedIndex !== null) move(draggedIndex, index); setDraggedIndex(null); }}>
      <input name="termIds" type="hidden" value={term.id} />
      <span aria-hidden="true" className="cursor-grab select-none text-lg font-bold text-muted">⋮⋮</span>
      <span className="min-w-0 flex-1 truncate font-chinese font-bold">{label}</span>
      <span className="hidden max-w-48 truncate text-xs text-muted sm:block">{getDefinitionPreview(term)}</span>
      <button aria-label={`Move ${label} up`} className="size-7 rounded text-sm font-bold text-muted hover:bg-muted-background disabled:opacity-30" disabled={index === 0} onClick={() => move(index, index - 1)} type="button">↑</button>
      <button aria-label={`Move ${label} down`} className="size-7 rounded text-sm font-bold text-muted hover:bg-muted-background disabled:opacity-30" disabled={index === selected.length - 1} onClick={() => move(index, index + 1)} type="button">↓</button>
      <button aria-label={`Remove ${label}`} className="flex size-5 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-danger/10" onClick={() => setSelected((items) => items.filter((item) => item.id !== term.id))} type="button"><Image alt="" className="size-2.5" height={10} src="/icons/cross.svg" width={10} /></button>
    </li>;
  })}</ol> : <p className="rounded-lg border border-muted-background bg-background px-4 py-3 text-sm text-muted">The first term will be shown on the deck&apos;s preview. Add at least one term before saving this deck.</p>;
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
    <div className="space-y-2"><p className="text-sm font-bold">Terms ({selected.length})</p><ReorderableTerms preferences={preferences} selected={selected} setSelected={setSelected} /></div>
  </div>;
}

function EditTermsModal({ deck, onClose, preferences }: { deck: PersonalDeck; onClose: () => void; preferences: LanguagePreferences }) {
  const [selected, setSelected] = useState<DictionaryTerm[]>(deck.terms);
  const [state, action, pending] = useActionState(async (previous: DeckActionState, formData: FormData) => {
    const next = await updateDeckTerms(previous, formData);
    if (next.success) onClose();
    return next;
  }, initialState);
  return <div aria-labelledby={`edit-terms-${deck.id}`} aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 px-4 py-6" role="dialog">
    <div className="max-h-full w-full max-w-3xl overflow-y-auto rounded-lg border border-muted-background bg-surface p-5 shadow-lg sm:p-6">
      <div className="flex items-start justify-between gap-4"><div><h2 className="font-heading text-2xl font-semibold" id={`edit-terms-${deck.id}`}>Edit terms</h2><p className="mt-1 text-sm text-muted">{deck.title}</p></div><button aria-label="Close term editor" className="grid size-10 place-items-center rounded-lg hover:bg-muted-background" onClick={onClose} type="button"><Image alt="" height={16} src="/icons/cross.svg" width={16} /></button></div>
      <form action={action} className="mt-5 space-y-5"><input name="id" type="hidden" value={deck.id} /><TermPicker preferences={preferences} selected={selected} setSelected={setSelected} /><Message state={state} /><div className="flex justify-end gap-3"><button className="h-10 rounded-lg border border-muted-background px-4 text-sm font-bold hover:border-primary" onClick={onClose} type="button">Cancel</button><button className="h-10 rounded-lg bg-primary px-4 text-sm font-bold text-text-light disabled:opacity-50" disabled={pending || selected.length === 0} type="submit">{pending ? "Saving…" : "Save terms"}</button></div></form>
    </div>
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
    <div className="flex flex-wrap items-center justify-between gap-4"><button className="h-11 rounded-lg bg-primary px-5 text-sm font-bold text-text-light hover:bg-primary/90" onClick={() => setShowCreate((value) => !value)} type="button">{showCreate ? "Close" : "Create deck"}</button></div>
    {showCreate && <form action={action} className="space-y-4 rounded-lg border border-muted-background bg-surface p-5 sm:p-6">
      <h2 className="font-heading text-2xl font-semibold">Create a private deck</h2>
      <label className="block space-y-2"><span className="text-sm font-bold">Deck title</span><input autoFocus className={field} maxLength={100} name="title" placeholder="Food and restaurants" required /></label>
      <label className="block space-y-2"><span className="text-sm font-bold">Description <span className="font-normal text-muted">(optional)</span></span><textarea className={`${field} min-h-28 py-3`} maxLength={500} name="description" placeholder="Words I want to practice before my trip." /></label>
      <TermPicker preferences={preferences} selected={selectedTerms} setSelected={setSelectedTerms} />
      <Message state={state} /><button className="h-11 rounded-lg bg-confirm px-5 text-sm font-bold text-text-light disabled:opacity-60" disabled={pending || selectedTerms.length === 0} type="submit">{pending ? "Creating…" : "Create deck"}</button>
    </form>}
    {decks.length ? <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{decks.map((deck) => <DeckEditor deck={deck} key={deck.id} preferences={preferences} />)}</ul> : <div className="rounded-lg border border-muted-background bg-surface p-6 text-muted"><p className="font-bold text-foreground">No personal decks yet</p><p className="mt-2 text-sm leading-6">Create your first private deck to start organizing vocabulary.</p></div>}
  </div>;
}
