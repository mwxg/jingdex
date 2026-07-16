"use client";

import Image from "next/image";
import { UsernameLink } from "@/components/username-link";
import {
  getChineseDisplayForms,
  type LanguagePreferences,
} from "@/lib/preferences/language";
import { getPartOfSpeechLabel, type PartOfSpeech } from "@/lib/terms/parts-of-speech";

export type TermDetails = {
  id: string;
  simplified: string;
  traditional: string | null;
  pinyin: string;
  zhuyin: string;
  english_definition: string | null;
  short_definition: string | null;
  parts_of_speech: PartOfSpeech[] | null;
  notes: string | null;
  added_by_display: string;
};

function getPartsOfSpeechLabel(partsOfSpeech: string[]) {
  return partsOfSpeech.map(getPartOfSpeechLabel).join(", ");
}

export function TermDetailsModal({
  onClose,
  preferences,
  term,
}: Readonly<{
  onClose: () => void;
  preferences: LanguagePreferences;
  term: TermDetails;
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
          <Image aria-hidden="true" alt="" height={16} src="/icons/cross.svg" width={16} />
        </button>

        <div className="pr-10">
          <p className="font-sans text-sm font-bold uppercase text-primary">Dictionary term</p>
          <h2 className="mt-2 font-chinese text-5xl font-bold text-foreground" id="dictionary-term-title">
            {forms.primary}
          </h2>
          {forms.secondary ? <p className="mt-1 font-chinese text-2xl text-muted">{forms.secondary}</p> : null}
        </div>

        <dl className="mt-6 grid gap-4 font-sans text-base sm:grid-cols-2">
          <div><dt className="text-sm font-bold text-muted">Pinyin</dt><dd className="mt-1 text-foreground">{term.pinyin}</dd></div>
          <div><dt className="text-sm font-bold text-muted">Zhuyin</dt><dd className="mt-1 text-foreground">{term.zhuyin}</dd></div>
          {term.parts_of_speech?.length ? (
            <div><dt className="text-sm font-bold text-muted">Part of speech</dt><dd className="mt-1 text-foreground">{getPartsOfSpeechLabel(term.parts_of_speech)}</dd></div>
          ) : null}
          <div><dt className="text-sm font-bold text-muted">Added by</dt><dd className="mt-1 text-foreground"><UsernameLink username={term.added_by_display} /></dd></div>
          {term.short_definition ? (
            <div><dt className="text-sm font-bold text-muted">Short definition</dt><dd className="mt-1 text-foreground">{term.short_definition}</dd></div>
          ) : null}
          <div className="sm:col-span-2"><dt className="text-sm font-bold text-muted">Definition</dt><dd className="mt-1 whitespace-pre-line leading-7 text-foreground">{term.english_definition || "No definition added."}</dd></div>
          {term.notes ? (
            <div className="sm:col-span-2"><dt className="text-sm font-bold text-muted">Notes</dt><dd className="mt-1 leading-7 text-foreground">{term.notes}</dd></div>
          ) : null}
        </dl>
      </div>
    </div>
  );
}
