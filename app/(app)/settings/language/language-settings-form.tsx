"use client";

import { useActionState, useState } from "react";
import type {
  CharacterSetPreference,
  LanguagePreferences,
  PronunciationPreference,
} from "@/lib/preferences/language";
import { updateLanguageSettings, type LanguageSettingsState } from "./actions";

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
  const [state, action] = useActionState(updateLanguageSettings, {});
  const [characterSet, setCharacterSet] =
    useState<CharacterSetPreference>(preferences.characterSet);
  const [pronunciation, setPronunciation] =
    useState<PronunciationPreference>(preferences.pronunciation);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-heading text-4xl font-semibold text-foreground">
          Language settings
        </h1>
      </div>

      <section className="rounded-lg border border-muted-background bg-surface p-6">
        <form action={action} className="space-y-6">
          <Message state={state} />

          <OptionSwitch<CharacterSetPreference>
            label="Writing system"
            name="characterSet"
            onChange={setCharacterSet}
            options={[
              {
                label: "Simplified",
                preview: "学习",
                value: "simplified",
              },
              {
                label: "Traditional",
                preview: "學習",
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
                preview: "xuexi",
                value: "pinyin",
              },
              {
                label: "Zhuyin",
                preview: "ㄒㄩㄝˊ ㄒㄧˊ",
                value: "zhuyin",
              },
            ]}
            value={pronunciation}
          />

          <button
            className="h-11 rounded-lg bg-primary px-5 font-sans text-sm font-bold text-text-light transition-colors hover:bg-primary/90"
            type="submit"
          >
            Save language settings
          </button>
        </form>
      </section>
    </div>
  );
}
