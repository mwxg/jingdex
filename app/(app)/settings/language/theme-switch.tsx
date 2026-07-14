"use client";

import { useSyncExternalStore } from "react";

type Theme = "light" | "dark";

const themeStorageKey = "jingdex-theme";
const themeChangeEvent = "jingdex-theme-change";

function subscribeToTheme(onStoreChange: () => void) {
  window.addEventListener(themeChangeEvent, onStoreChange);
  return () => window.removeEventListener(themeChangeEvent, onStoreChange);
}

function getTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function getServerTheme(): Theme {
  return "light";
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;

  try {
    localStorage.setItem(themeStorageKey, theme);
  } catch {
    // The selected theme still applies for this page if storage is unavailable.
  }

  window.dispatchEvent(new Event(themeChangeEvent));
}

export function ThemeSwitch() {
  const theme = useSyncExternalStore(
    subscribeToTheme,
    getTheme,
    getServerTheme,
  );

  function toggleTheme() {
    const nextTheme = theme === "light" ? "dark" : "light";
    applyTheme(nextTheme);
  }

  const isDark = theme === "dark";

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-muted-background bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <p className="font-sans text-sm font-bold text-foreground">Dark mode</p>
        <p className="font-sans text-sm text-muted">
          Use a darker palette for lower-light environments.
        </p>
      </div>
      <button
        aria-checked={isDark}
        aria-label="Dark mode"
        className="inline-flex min-h-11 shrink-0 items-center justify-between gap-3 self-start rounded-lg px-1 font-sans text-sm font-bold text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:self-auto"
        onClick={toggleTheme}
        role="switch"
        type="button"
      >
        <span aria-hidden="true">{isDark ? "Dark" : "Light"}</span>
        <span
          aria-hidden="true"
          className={`relative h-7 w-12 rounded-full transition-colors ${
            isDark ? "bg-primary" : "bg-muted-background"
          }`}
        >
          <span
            className={`absolute left-1 top-1 size-5 rounded-full bg-surface shadow-sm transition-transform ${
              isDark ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </span>
      </button>
    </div>
  );
}
