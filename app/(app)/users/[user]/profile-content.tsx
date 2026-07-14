"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { PendingLabel } from "@/components/loading";
import {
  getChineseDisplayForms,
  type LanguagePreferences,
} from "@/lib/preferences/language";
import {
  getPartOfSpeechLabel,
  type PartOfSpeech,
} from "@/lib/terms/parts-of-speech";
import { getDefinitionPreview } from "@/lib/terms/definition-preview";
import { updateBio, type BioFormState } from "./actions";

export type ProfileDeck = {
  description: string | null;
  id: string;
  title: string;
};

export type ProfileTerm = {
  added_by: string;
  english_definition: string | null;
  id: string;
  notes: string | null;
  parts_of_speech: PartOfSpeech[] | null;
  pinyin: string;
  short_definition: string | null;
  simplified: string;
  traditional: string | null;
  zhuyin: string;
};

function BioEditor({ bio }: Readonly<{ bio: string | null }>) {
  const [state, action, pending] = useActionState<BioFormState, FormData>(
    updateBio,
    {},
  );

  return (
    <form action={action} className="mt-5 space-y-3">
      <label className="block space-y-2">
        <span className="font-sans text-sm font-bold text-foreground">Bio</span>
        <textarea
          className="min-h-28 w-full resize-y rounded-lg border border-muted-background bg-background px-4 py-3 font-sans text-sm leading-6 text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary"
          defaultValue={bio ?? ""}
          maxLength={240}
          name="bio"
          placeholder="Tell other learners a little about yourself."
        />
      </label>
      {state.message ? (
        <p className="font-sans text-sm font-bold text-danger" role="alert">
          {state.message}
        </p>
      ) : null}
      {state.success ? (
        <p className="font-sans text-sm font-bold text-confirm" role="status">
          {state.success}
        </p>
      ) : null}
      <button
        className="h-11 rounded-lg bg-primary px-5 font-sans text-sm font-bold text-on-primary transition-colors hover:bg-primary/90 disabled:cursor-wait disabled:opacity-70"
        disabled={pending}
        type="submit"
      >
        {pending ? <PendingLabel>Saving bio</PendingLabel> : "Save bio"}
      </button>
    </form>
  );
}

function TermDetailsModal({
  onClose,
  preferences,
  term,
}: Readonly<{
  onClose: () => void;
  preferences: LanguagePreferences;
  term: ProfileTerm;
}>) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const forms = getChineseDisplayForms(term, preferences.characterSet);

  useEffect(() => {
    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    closeButtonRef.current?.focus();
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-foreground/25 px-4 py-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        aria-labelledby="profile-term-title"
        aria-modal="true"
        className="relative max-h-full w-full max-w-2xl overflow-y-auto rounded-lg border border-muted-background bg-surface p-6 shadow-xl"
        role="dialog"
      >
        <button
          aria-label="Close term details"
          className="absolute right-3 top-3 grid size-10 place-items-center rounded-lg transition-colors hover:bg-muted-background"
          onClick={onClose}
          ref={closeButtonRef}
          type="button"
        >
          <span aria-hidden="true" className="text-2xl leading-none text-foreground">
            &times;
          </span>
        </button>
        <div className="pr-10">
          <p className="font-sans text-sm font-bold uppercase text-primary">
            Dictionary term
          </p>
          <h2
            className="mt-2 font-chinese text-5xl font-bold text-foreground"
            id="profile-term-title"
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
          {term.parts_of_speech?.length ? (
            <div>
              <dt className="text-sm font-bold text-muted">Part of speech</dt>
              <dd className="mt-1 text-foreground">
                {term.parts_of_speech.map(getPartOfSpeechLabel).join(", ")}
              </dd>
            </div>
          ) : null}
          <div>
            <dt className="text-sm font-bold text-muted">Added by</dt>
            <dd className="mt-1 text-foreground">
              {term.added_by || "Jingdex"}
            </dd>
          </div>
          {term.short_definition ? (
            <div className="sm:col-span-2">
              <dt className="text-sm font-bold text-muted">Short definition</dt>
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

export function ProfileContent({
  bio,
  createdAt,
  deckCount,
  deckPage,
  decks,
  preferences,
  terms,
  username,
  wordCount,
  wordPage,
}: Readonly<{
  bio: string | null;
  createdAt: string;
  deckCount: number;
  deckPage: number;
  decks: ProfileDeck[];
  preferences: LanguagePreferences;
  terms: ProfileTerm[];
  username: string;
  wordCount: number;
  wordPage: number;
}>) {
  const [selectedTerm, setSelectedTerm] = useState<ProfileTerm | null>(null);

  return (
    <main className="flex-1 bg-background px-4 py-8 text-foreground sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-6xl space-y-10">
        <section className="grid gap-6 rounded-lg border border-muted-background bg-surface p-5 sm:p-7 md:grid-cols-[10rem_minmax(0,1fr)]">
          <Image
            alt={`${username}'s profile picture`}
            className="size-32 rounded-lg border border-muted-background object-cover sm:size-40"
            height={160}
            priority
            src="/images/pfp_placeholder.png"
            width={160}
          />
          <div className="min-w-0">
            <p className="font-sans text-sm font-bold uppercase text-primary">
              My profile
            </p>
            <h1 className="mt-1 wrap-break-word font-heading text-4xl font-semibold sm:text-5xl">
              {username}
            </h1>
            <p className="mt-2 font-sans text-sm text-muted">
              Joined {createdAt}
            </p>
            <BioEditor bio={bio} />
          </div>
        </section>

        <DeckSection
          count={deckCount}
          currentPage={deckPage}
          decks={decks}
          username={username}
          wordPage={wordPage}
        />
        <TermSection
          count={wordCount}
          currentPage={wordPage}
          deckPage={deckPage}
          onSelect={setSelectedTerm}
          preferences={preferences}
          terms={terms}
          username={username}
        />
      </div>
      {selectedTerm ? (
        <TermDetailsModal
          onClose={() => setSelectedTerm(null)}
          preferences={preferences}
          term={selectedTerm}
        />
      ) : null}
    </main>
  );
}

function Pagination({
  anchor,
  currentPage,
  getHref,
  pageSize,
  totalCount,
}: Readonly<{
  anchor: string;
  currentPage: number;
  getHref: (page: number) => string;
  pageSize: number;
  totalCount: number;
}>) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  if (totalPages <= 1) return null;

  const linkClasses =
    "inline-flex min-h-11 items-center rounded-lg border border-muted-background bg-surface px-4 font-sans text-sm font-bold text-foreground transition-colors hover:border-primary hover:text-primary";

  return (
    <nav
      aria-label={`${anchor} pagination`}
      className="flex flex-wrap items-center justify-between gap-3"
    >
      {currentPage > 1 ? (
        <Link className={linkClasses} href={getHref(currentPage - 1)}>
          Previous
        </Link>
      ) : (
        <span aria-disabled="true" className={`${linkClasses} opacity-50`}>
          Previous
        </span>
      )}
      <span className="font-sans text-sm text-muted">
        Page {currentPage} of {totalPages}
      </span>
      {currentPage < totalPages ? (
        <Link className={linkClasses} href={getHref(currentPage + 1)}>
          Next
        </Link>
      ) : (
        <span aria-disabled="true" className={`${linkClasses} opacity-50`}>
          Next
        </span>
      )}
    </nav>
  );
}

function getProfilePageHref({
  deckPage,
  username,
  wordPage,
  anchor,
}: {
  anchor: string;
  deckPage: number;
  username: string;
  wordPage: number;
}) {
  const params = new URLSearchParams();
  if (deckPage > 1) params.set("decksPage", String(deckPage));
  if (wordPage > 1) params.set("wordsPage", String(wordPage));
  const query = params.size ? `?${params.toString()}` : "";
  return `/users/${encodeURIComponent(username)}${query}#${anchor}`;
}

function DeckSection({
  count,
  currentPage,
  decks,
  username,
  wordPage,
}: Readonly<{
  count: number;
  currentPage: number;
  decks: ProfileDeck[];
  username: string;
  wordPage: number;
}>) {
  const rangeStart = decks.length === 0 ? 0 : (currentPage - 1) * 9 + 1;
  const rangeEnd =
    decks.length === 0 ? 0 : Math.min(rangeStart + decks.length - 1, count);

  return (
    <section
      aria-labelledby="profile-decks-heading"
      className="scroll-mt-4 space-y-4"
      id="profile-decks"
    >
      <div className="flex items-end justify-between gap-4">
        <h2 className="font-heading text-3xl font-semibold" id="profile-decks-heading">
          Public decks
        </h2>
        <span className="font-sans text-sm text-muted">
          Showing {rangeStart}&ndash;{rangeEnd} of {count}
        </span>
      </div>
      {decks.length ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {decks.map((deck) => (
            <li key={deck.id}>
              <Link
                className="block h-full rounded-lg border border-muted-background bg-surface p-5 transition-colors hover:border-primary focus:border-primary focus:outline-none"
                href={`/community/${deck.id}`}
              >
                <h3 className="font-heading text-2xl font-semibold text-foreground">
                  {deck.title}
                </h3>
                <p className="mt-2 line-clamp-3 font-sans text-sm leading-6 text-muted">
                  {deck.description || "No description added."}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-lg border border-muted-background bg-surface px-5 py-6 font-sans text-sm text-muted">
          No public decks yet.
        </p>
      )}
      <Pagination
        anchor="profile-decks"
        currentPage={currentPage}
        getHref={(page) =>
          getProfilePageHref({
            anchor: "profile-decks",
            deckPage: page,
            username,
            wordPage,
          })
        }
        pageSize={9}
        totalCount={count}
      />
    </section>
  );
}

function TermSection({
  onSelect,
  preferences,
  terms,
  count,
  currentPage,
  deckPage,
  username,
}: Readonly<{
  count: number;
  currentPage: number;
  deckPage: number;
  onSelect: (term: ProfileTerm) => void;
  preferences: LanguagePreferences;
  terms: ProfileTerm[];
  username: string;
}>) {
  const rangeStart = terms.length === 0 ? 0 : (currentPage - 1) * 10 + 1;
  const rangeEnd =
    terms.length === 0 ? 0 : Math.min(rangeStart + terms.length - 1, count);

  return (
    <section
      aria-labelledby="profile-words-heading"
      className="scroll-mt-4 space-y-4"
      id="profile-words"
    >
      <div className="flex items-end justify-between gap-4">
        <h2 className="font-heading text-3xl font-semibold" id="profile-words-heading">
          Contributed words
        </h2>
        <span className="font-sans text-sm text-muted">
          Showing {rangeStart}&ndash;{rangeEnd} of {count}
        </span>
      </div>
      {terms.length ? (
        <ul className="divide-y divide-muted-background overflow-hidden rounded-lg border border-muted-background bg-surface">
          {terms.map((term) => {
            const forms = getChineseDisplayForms(term, preferences.characterSet);
            const primaryPronunciation =
              preferences.pronunciation === "pinyin" ? term.pinyin : term.zhuyin;
            const secondaryPronunciation =
              preferences.pronunciation === "pinyin" ? term.zhuyin : term.pinyin;

            return (
              <li key={term.id}>
                <button
                  className="grid w-full gap-2 px-4 py-3 text-left transition-colors hover:bg-background focus:bg-background focus:outline-none sm:grid-cols-[minmax(9rem,0.7fr)_minmax(8rem,0.7fr)_minmax(12rem,1.4fr)] sm:items-center sm:px-5"
                  onClick={() => onSelect(term)}
                  type="button"
                >
                  <span className="min-w-0">
                    <span className="font-chinese text-2xl font-bold text-foreground">
                      {forms.primary}
                    </span>
                    {forms.secondary ? (
                      <span className="ml-2 font-chinese text-base text-muted">
                        {forms.secondary}
                      </span>
                    ) : null}
                  </span>
                  <span className="min-w-0 font-sans">
                    <span className="block truncate text-sm font-bold text-foreground">
                      {primaryPronunciation}
                    </span>
                    <span className="block truncate text-xs text-muted">
                      {secondaryPronunciation}
                    </span>
                  </span>
                  <span className="min-w-0 font-sans text-sm leading-6 text-muted sm:line-clamp-2">
                    {getDefinitionPreview(term) || "No definition added."}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="rounded-lg border border-muted-background bg-surface px-5 py-6 font-sans text-sm text-muted">
          No contributed words yet.
        </p>
      )}
      <Pagination
        anchor="profile-words"
        currentPage={currentPage}
        getHref={(page) =>
          getProfilePageHref({
            anchor: "profile-words",
            deckPage,
            username,
            wordPage: page,
          })
        }
        pageSize={10}
        totalCount={count}
      />
    </section>
  );
}
