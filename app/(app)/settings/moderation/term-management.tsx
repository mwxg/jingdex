"use client";

import { getGeneratedTermForms } from "@/lib/terms/generated-forms";
import { useActionState, useEffect, useState } from "react";
import {
  addBulkTerms,
  addSingleTerm,
  type TermAddState,
} from "./actions";
import { PartOfSpeechSelect } from "./part-of-speech-select";
import { TERM_DEFINITION_MAX_LENGTH } from "@/lib/terms/content-limits";

const initialState: TermAddState = {};

function TermMessage({ state }: Readonly<{ state: TermAddState }>) {
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

function TextInput({
  label,
  name,
  onChange,
  placeholder,
  required = true,
  value,
}: Readonly<{
  label: string;
  name: string;
  onChange?: (value: string) => void;
  placeholder: string;
  required?: boolean;
  value?: string;
}>) {
  return (
    <label className="space-y-2">
      <span className="block font-sans text-sm font-bold text-foreground">
        {label}
      </span>
      <input
        className="h-12 w-full rounded-lg border border-muted-background bg-surface px-4 font-sans text-base text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary"
        name={name}
        onChange={
          onChange ? (event) => onChange(event.target.value) : undefined
        }
        placeholder={placeholder}
        required={name === "traditional" ? false : required}
        type="text"
        value={value}
      />
    </label>
  );
}

function TextAreaInput({
  label,
  name,
  placeholder,
}: Readonly<{
  label: string;
  name: string;
  placeholder: string;
}>) {
  return (
    <label className="space-y-2">
      <span className="block font-sans text-sm font-bold text-foreground">
        {label}
      </span>
      <textarea
        className="min-h-28 w-full resize-y rounded-lg border border-muted-background bg-surface px-4 py-3 font-sans text-base text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary"
        name={name}
        maxLength={TERM_DEFINITION_MAX_LENGTH}
        placeholder={placeholder}
        required
      />
      <span className="block font-sans text-xs text-muted">
        Up to {TERM_DEFINITION_MAX_LENGTH.toLocaleString()} characters.
      </span>
    </label>
  );
}

export function TermManagement() {
  const [singleState, singleAction] = useActionState(
    addSingleTerm,
    initialState,
  );
  const [bulkState, bulkAction] = useActionState(addBulkTerms, initialState);
  const [simplified, setSimplified] = useState("");
  const [traditional, setTraditional] = useState("");
  const [pinyin, setPinyin] = useState("");
  const [zhuyin, setZhuyin] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  function updateSimplified(value: string) {
    setSimplified(value);

    if (!value.trim()) {
      setIsGenerating(false);
      setTraditional("");
      setPinyin("");
      setZhuyin("");
      return;
    }

    setIsGenerating(true);
  }

  useEffect(() => {
    const trimmedSimplified = simplified.trim();

    if (!trimmedSimplified) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      try {
        const generatedForms = getGeneratedTermForms(trimmedSimplified);
        const generatedTraditional =
          generatedForms.traditional === generatedForms.simplified
            ? ""
            : generatedForms.traditional;

        setTraditional(generatedTraditional);
        setPinyin(generatedForms.pinyin);
        setZhuyin(generatedForms.zhuyin);
      } catch {
        setTraditional("");
        setPinyin("");
        setZhuyin("");
      } finally {
        setIsGenerating(false);
      }
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [simplified]);

  return (
    <section className="rounded-lg border border-muted-background bg-surface p-6">
      <div className="space-y-2">
        <h2 className="font-heading text-2xl font-semibold text-foreground">
          Term management
        </h2>
      </div>

      <div className="mt-5 grid gap-6 xl:grid-cols-2">
        <form action={singleAction} className="space-y-5">
          <div className="space-y-1">
            <h3 className="font-heading text-xl font-semibold text-foreground">
              Add one term
            </h3>
          </div>

          <TermMessage state={singleState} />

          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput
              label="Simplified"
              name="simplified"
              onChange={updateSimplified}
              placeholder="Simplified Chinese"
              value={simplified}
            />
            <TextInput
              label="Traditional"
              name="traditional"
              onChange={setTraditional}
              placeholder="Generated from simplified"
              value={traditional}
            />
            <TextInput
              label="Pinyin"
              name="pinyin"
              onChange={setPinyin}
              placeholder="Generated from simplified"
              value={pinyin}
            />
            <TextInput
              label="Zhuyin"
              name="zhuyin"
              onChange={setZhuyin}
              placeholder="Generated from simplified"
              value={zhuyin}
            />
            <PartOfSpeechSelect />
          </div>

          {isGenerating ? (
            <p
              aria-live="polite"
              className="font-sans text-sm font-bold text-primary"
            >
              Generating traditional, pinyin, and zhuyin...
            </p>
          ) : null}

          <TextAreaInput
            label="Definition"
            name="definition"
            placeholder="to study; to learn"
          />

          <button
            className="h-12 rounded-lg bg-primary px-5 font-sans text-sm font-bold text-on-primary transition-colors hover:bg-primary/90"
            type="submit"
          >
            Add term
          </button>
        </form>

        <form action={bulkAction} className="space-y-5">
          <div className="space-y-1">
            <h3 className="font-heading text-xl font-semibold text-foreground">
              Import text file
            </h3>
          </div>

          <TermMessage state={bulkState} />

          <label className="block space-y-2">
            <span className="block font-sans text-sm font-bold text-foreground">
              Terms file
            </span>
            <input
              accept=".txt,text/plain"
              className="w-full rounded-lg border border-muted-background bg-surface px-4 py-3 font-sans text-base text-foreground file:mr-4 file:rounded-lg file:border-0 file:bg-muted-background file:px-4 file:py-2 file:font-sans file:text-sm file:font-bold file:text-foreground hover:file:bg-primary/10"
              name="termsFile"
              type="file"
            />
          </label>

          <button
            className="h-12 rounded-lg bg-primary px-5 font-sans text-sm font-bold text-on-primary transition-colors hover:bg-primary/90"
            type="submit"
          >
            Import terms
          </button>
        </form>
      </div>
    </section>
  );
}
