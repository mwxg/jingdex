"use client";

import { useActionState, useEffect, useState } from "react";
import { getGeneratedTermForms } from "@/lib/terms/generated-forms";
import { PartOfSpeechSelect } from "@/app/(app)/settings/moderation/part-of-speech-select";
import { PendingLabel } from "@/components/loading";
import {
  TERM_DEFINITION_MAX_LENGTH,
  TERM_NOTES_MAX_LENGTH,
} from "@/lib/terms/content-limits";
import { submitContribution, type ContributionActionState } from "./actions";

const initialState: ContributionActionState = {};

export function ActionMessage({ state }: Readonly<{ state: ContributionActionState }>) {
  if (!state.message && !state.success) return null;
  return (
    <p aria-live="polite" className={`rounded-lg border px-4 py-3 font-sans text-sm font-bold ${
      state.message
        ? "border-danger/30 bg-danger/10 text-danger"
        : "border-confirm/30 bg-confirm/10 text-confirm"
    }`}>
      {state.message ?? state.success}
    </p>
  );
}

const inputClass = "h-12 w-full rounded-lg border border-muted-background bg-surface px-4 font-sans text-base text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary";

export function ContributionForm() {
  const [state, action, pending] = useActionState(submitContribution, initialState);
  const [simplified, setSimplified] = useState("");
  const [traditional, setTraditional] = useState("");
  const [pinyin, setPinyin] = useState("");
  const [zhuyin, setZhuyin] = useState("");

  useEffect(() => {
    if (!simplified.trim()) return;
    const timeout = window.setTimeout(() => {
      const forms = getGeneratedTermForms(simplified);
      setTraditional(forms.traditional === forms.simplified ? "" : forms.traditional);
      setPinyin(forms.pinyin);
      setZhuyin(forms.zhuyin);
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [simplified]);

  return (
    <form action={action} aria-busy={pending} className="space-y-5">
      <ActionMessage state={state} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="Simplified" name="simplified" value={simplified} onChange={setSimplified} />
        <Field label="Traditional" name="traditional" required={false} value={traditional} onChange={setTraditional} />
        <Field label="Pinyin" name="pinyin" value={pinyin} onChange={setPinyin} />
        <Field label="Zhuyin" name="zhuyin" value={zhuyin} onChange={setZhuyin} />
        <PartOfSpeechSelect />
      </div>
      <label className="block space-y-2">
        <span className="font-sans text-sm font-bold">Definition</span>
        <textarea aria-describedby="definition-limit" placeholder="Separate significantly different meanings by newlines." className="min-h-28 w-full resize-y rounded-lg border border-muted-background bg-surface px-4 py-3 font-sans outline-none focus:border-primary" maxLength={TERM_DEFINITION_MAX_LENGTH} name="definition" required />
        <span className="block font-sans text-xs text-muted" id="definition-limit">Up to 10,000 characters.</span>
      </label>
      <label className="block space-y-2">
        <span className="font-sans text-sm font-bold">Contributor notes <span className="font-normal text-muted">(optional)</span></span>
        <textarea aria-describedby="notes-limit" placeholder="Add your own note to the word (extra context, fun facts, etc). Will be visible to everyone once the term is accepted." className="min-h-24 w-full resize-y rounded-lg border border-muted-background bg-surface px-4 py-3 font-sans outline-none focus:border-primary" maxLength={TERM_NOTES_MAX_LENGTH} name="notes" />
        <span className="block font-sans text-xs text-muted" id="notes-limit">Up to 4,000 characters.</span>
      </label>
      <button className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-5 font-sans text-sm font-bold text-on-primary hover:bg-primary/90 disabled:opacity-60" disabled={pending} type="submit">
        {pending ? <PendingLabel>Submitting…</PendingLabel> : "Submit for review"}
      </button>
    </form>
  );
}

function Field({ label, name, onChange, required = true, value }: Readonly<{
  label: string; name: string; onChange: (value: string) => void; required?: boolean; value: string;
}>) {
  return (
    <label className="space-y-2">
      <span className="block font-sans text-sm font-bold">{label}</span>
      <input className={inputClass} name={name} onChange={(event) => onChange(event.target.value)} required={required} type="text" value={value} />
    </label>
  );
}
