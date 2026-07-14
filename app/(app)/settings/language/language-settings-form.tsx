"use client";

import { FormEvent, useState, useTransition } from "react";
import type {
  CharacterSetPreference,
  LanguagePreferences,
  PronunciationPreference,
} from "@/lib/preferences/language";
import { updateLanguageSettings, type LanguageSettingsState } from "./actions";
import { PendingLabel } from "@/components/loading";
import { ThemeSwitch } from "./theme-switch";

function Message({ state }: Readonly<{ state: LanguageSettingsState }>) {
  if (state.success) {
    return (
      <p className="rounded-lg border border-confirm/30 bg-confirm/10 px-4 py-3 font-sans text-sm font-bold text-confirm">
        {state.success}
      </p>
    );
  }

  if (state.message) {
    return (
      <p className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 font-sans text-sm font-bold text-danger">
        {state.message}
      </p>
    );
  }

  return null;
}

function OptionSwitch<TValue extends string>({
  label,
  name,
  onChange,
  options,
  value,
}: Readonly<{
  label: string;
  name: string;
  onChange: (value: TValue) => void;
  options: readonly {
    label: string;
    preview?: string;
    value: TValue;
  }[];
  value: TValue;
}>) {
  return (
    <fieldset className="space-y-3">
      <legend className="font-sans text-sm font-bold text-foreground">
        {label}
      </legend>
      <div className="grid gap-2 rounded-lg border border-muted-background bg-background p-1 sm:grid-cols-2">
        {options.map((option) => {
          const isSelected = value === option.value;

          return (
            <label
              className={`flex cursor-pointer items-center justify-between gap-3 rounded-md px-4 py-3 transition-colors ${
                isSelected
                  ? "bg-surface text-foreground shadow-sm"
                  : "text-muted hover:bg-surface/70 hover:text-foreground"
              }`}
              key={option.value}
            >
              <span>
                <span className="block font-sans text-sm font-bold">
                  {option.label}
                </span>
                {option.preview ? (
                  <span className="mt-1 block font-chinese text-xl font-bold">
                    {option.preview}
                  </span>
                ) : null}
              </span>
              <input
                checked={isSelected}
                className="size-4 accent-primary"
                name={name}
                onChange={() => onChange(option.value)}
                type="radio"
                value={option.value}
              />
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function LanguageSettingsForm({
  preferences,
}: Readonly<{
  preferences: LanguagePreferences;
}>) {
  const [state, setState] = useState<LanguageSettingsState>({});
  const [isPending, startTransition] = useTransition();
  const [characterSet, setCharacterSet] =
    useState<CharacterSetPreference>(preferences.characterSet);
  const [pronunciation, setPronunciation] =
    useState<PronunciationPreference>(preferences.pronunciation);

  function submitSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const nextState = await updateLanguageSettings(state, formData);

      if (nextState.characterSet) {
        setCharacterSet(nextState.characterSet);
      }

      if (nextState.pronunciation) {
        setPronunciation(nextState.pronunciation);
      }

      setState(nextState);
    });
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-heading text-4xl font-semibold text-foreground">
          Site settings
        </h1>
      </div>

      <section className="space-y-5 rounded-lg border border-muted-background bg-surface p-6">
        <div className="space-y-1">
          <h2 className="font-heading text-2xl font-semibold text-foreground">
            Appearance
          </h2>
          <p className="font-sans text-sm text-muted">
            Choose how Jingdex looks on this device.
          </p>
        </div>
        <ThemeSwitch />
      </section>

      <section className="rounded-lg border border-muted-background bg-surface p-6">
        <form
          aria-busy={isPending}
          className="space-y-6"
          onSubmit={submitSettings}
        >
          <div className="space-y-1">
            <h2 className="font-heading text-2xl font-semibold text-foreground">
              Language preferences
            </h2>
            <p className="font-sans text-sm text-muted">
              Choose the characters and pronunciation shown most prominently.
            </p>
          </div>

          <Message state={state} />

          <OptionSwitch<CharacterSetPreference>
            label="Writing system"
            name="characterSet"
            onChange={setCharacterSet}
            options={[
              {
                label: "Simplified",
                preview: "简体",
                value: "simplified",
              },
              {
                label: "Traditional",
                preview: "繁體",
                value: "traditional",
              },
            ]}
            value={characterSet}
          />

          <OptionSwitch<PronunciationPreference>
            label="Pronunciation"
            name="pronunciation"
            onChange={setPronunciation}
            options={[
              {
                label: "Pinyin",
                preview: "pīn yīn",
                value: "pinyin",
              },
              {
                label: "Zhuyin",
                preview: "ㄓㄨˋ ㄧㄣ",
                value: "zhuyin",
              },
            ]}
            value={pronunciation}
          />

          <button
            className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-5 font-sans text-sm font-bold text-text-light transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isPending}
            type="submit"
          >
            {isPending ? (
              <PendingLabel>Saving…</PendingLabel>
            ) : (
              "Save language preferences"
            )}
          </button>
        </form>
      </section>
    </div>
  );
}
