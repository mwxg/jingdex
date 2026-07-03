"use client";

import {
  getPartOfSpeechLabel,
  partsOfSpeechOptions,
} from "@/lib/terms/parts-of-speech";
import { useId, useState } from "react";

export function PartOfSpeechSelect({
  selectedValues,
}: Readonly<{ selectedValues?: readonly string[] | null }>) {
  const safeSelectedValues = Array.isArray(selectedValues)
    ? selectedValues
    : [];
  const [isOpen, setIsOpen] = useState(false);
  const [selectedParts, setSelectedParts] = useState<string[]>(() =>
    partsOfSpeechOptions
      .map((option) => option.value)
      .filter((value) => safeSelectedValues.includes(value)),
  );
  const buttonId = useId();
  const selectedLabels = selectedParts.map(getPartOfSpeechLabel);
  const summary =
    selectedLabels.length > 0 ? selectedLabels.join(", ") : "Choose parts";

  function togglePart(value: string, isChecked: boolean) {
    setSelectedParts((currentParts) => {
      if (isChecked) {
        return currentParts.includes(value)
          ? currentParts
          : [...currentParts, value];
      }

      return currentParts.filter((part) => part !== value);
    });
  }

  return (
    <div className="relative space-y-2">
      <span className="block font-sans text-sm font-bold text-foreground">
        Part of speech
      </span>
      <button
        aria-controls={`${buttonId}-menu`}
        aria-expanded={isOpen}
        className="flex min-h-12 w-full items-center justify-between gap-3 rounded-lg border border-muted-background bg-surface px-4 py-2 text-left font-sans text-base text-foreground outline-none transition-colors hover:border-primary focus:border-primary"
        id={buttonId}
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        type="button"
      >
        <span className="min-w-0 truncate">{summary}</span>
        <span aria-hidden="true" className="shrink-0 text-muted">
          {isOpen ? "^" : "v"}
        </span>
      </button>

      {selectedParts.map((part) => (
        <input key={part} name="partsOfSpeech" type="hidden" value={part} />
      ))}

      {isOpen ? (
        <div
          aria-labelledby={buttonId}
          className="absolute z-10 max-h-72 w-full overflow-y-auto rounded-lg border border-muted-background bg-surface p-2 shadow-lg"
          id={`${buttonId}-menu`}
        >
          {partsOfSpeechOptions.map((option) => (
            <label
              className="flex items-center gap-3 rounded-lg px-3 py-2 font-sans text-sm font-bold text-foreground hover:bg-muted-background"
              key={option.value}
            >
              <input
                className="size-4 accent-primary"
                checked={selectedParts.includes(option.value)}
                onChange={(event) =>
                  togglePart(option.value, event.target.checked)
                }
                type="checkbox"
                value={option.value}
              />
              {option.label}
            </label>
          ))}
        </div>
      ) : null}
    </div>
  );
}
