"use client";

import { useState } from "react";
import {
  getChineseDisplayForms,
  type LanguagePreferences,
} from "@/lib/preferences/language";
import { getPartOfSpeechLabel } from "@/lib/terms/parts-of-speech";
import { type CommunityDeckDetails } from "../data";

function getPartsOfSpeechLabel(partsOfSpeech: string[] | null) {
  if (!partsOfSpeech || partsOfSpeech.length === 0) {
    return null;
  }

  return partsOfSpeech.map(getPartOfSpeechLabel).join(", ");
}

export function DeckBrowser({
  deck,
  preferences,
}: Readonly<{
  deck: CommunityDeckDetails;
  preferences: LanguagePreferences;
}>) {
  const [termIndex, setTermIndex] = useState(0);
  const term = deck.terms[termIndex] ?? null;

  if (!term) {
    return (
      <section className="rounded-lg border border-muted-background bg-surface p-6">
        <p className="font-sans text-sm text-muted">
          This deck does not have any terms yet.
        </p>
      </section>
    );
  }

  const forms = getChineseDisplayForms(term, preferences.characterSet);
  const partOfSpeechLabel = getPartsOfSpeechLabel(term.parts_of_speech);
  const preferredPronunciation =
    preferences.pronunciation === "zhuyin" ? term.zhuyin : term.pinyin;
  const secondaryPronunciation =
    preferences.pronunciation === "zhuyin" ? term.pinyin : term.zhuyin;
  const preferredPronunciationLabel =
    preferences.pronunciation === "zhuyin" ? "Zhuyin" : "Pinyin";
  const secondaryPronunciationLabel =
    preferences.pronunciation === "zhuyin" ? "Pinyin" : "Zhuyin";

  return (
    <section className="rounded-lg border border-muted-background bg-surface p-6">
      <div className="flex flex-col gap-4 border-b border-muted-background pb-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-sans text-sm font-bold uppercase text-primary">
          Term {termIndex + 1} of {deck.terms.length}
        </p>
        <div className="flex gap-3">
          <button
            className="h-11 rounded-lg border border-muted-background px-4 font-sans text-sm font-bold text-foreground transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
            disabled={termIndex === 0}
            onClick={() => setTermIndex((current) => Math.max(0, current - 1))}
            type="button"
          >
            Previous
          </button>
          <button
            className="h-11 rounded-lg bg-primary px-4 font-sans text-sm font-bold text-text-light transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={termIndex === deck.terms.length - 1}
            onClick={() =>
              setTermIndex((current) =>
                Math.min(deck.terms.length - 1, current + 1),
              )
            }
            type="button"
          >
            Next
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="rounded-lg bg-muted-background px-5 py-8">
          <p className="font-sans text-sm font-bold text-muted">
            {preferredPronunciationLabel}
          </p>
          <h2 className="mt-3 font-chinese text-7xl font-bold leading-none text-foreground sm:text-8xl">
            {forms.primary}
          </h2>
          {forms.secondary ? (
            <p className="mt-4 font-chinese text-3xl text-muted">
              {forms.secondary}
            </p>
          ) : null}
          <p className="mt-5 font-sans text-xl font-bold text-primary">
            {preferredPronunciation}
          </p>
        </div>

        <dl className="grid gap-4 font-sans text-base sm:grid-cols-2">
          <div>
            <dt className="text-sm font-bold text-muted">
              {preferredPronunciationLabel}
            </dt>
            <dd className="mt-1 text-foreground">{preferredPronunciation}</dd>
          </div>
          <div>
            <dt className="text-sm font-bold text-muted">
              {secondaryPronunciationLabel}
            </dt>
            <dd className="mt-1 text-foreground">{secondaryPronunciation}</dd>
          </div>
          {partOfSpeechLabel ? (
            <div>
              <dt className="text-sm font-bold text-muted">Part of speech</dt>
              <dd className="mt-1 text-foreground">{partOfSpeechLabel}</dd>
            </div>
          ) : null}
          <div>
            <dt className="text-sm font-bold text-muted">Added by</dt>
            <dd className="mt-1 text-foreground">{term.added_by_display}</dd>
          </div>
          {term.short_definition ? (
            <div className="sm:col-span-2">
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
    </section>
  );
}
