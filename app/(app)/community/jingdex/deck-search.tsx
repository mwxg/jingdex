"use client";

import { useState } from "react";
import { type LanguagePreferences } from "@/lib/preferences/language";
import { type CommunityDeckSummary } from "../data";
import { CommunityDeckCard } from "../deck-card";

export function JingdexDeckSearch({
  decks,
  preferences,
}: Readonly<{
  decks: CommunityDeckSummary[];
  preferences: LanguagePreferences;
}>) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().normalize("NFC").toLocaleLowerCase();
  const visibleDecks = normalizedQuery
    ? decks.filter(
        (deck) =>
          deck.title.toLocaleLowerCase().includes(normalizedQuery) ||
          (deck.description ?? "")
            .toLocaleLowerCase()
            .includes(normalizedQuery),
      )
    : decks;

  return (
    <div className="space-y-8">
      <div className="rounded-lg border border-muted-background bg-surface p-4 sm:p-6">
        <label className="space-y-2">
          <span className="block font-sans text-sm font-bold text-foreground">
            Search decks
          </span>
          <input
            className="h-12 w-full rounded-lg border border-muted-background bg-surface px-4 font-sans text-base text-foreground outline-none placeholder:text-muted focus:border-primary"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by title or description"
            type="search"
            value={query}
          />
        </label>
      </div>

      {visibleDecks.length > 0 ? (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleDecks.map((deck) => (
            <CommunityDeckCard
              deck={deck}
              key={deck.id}
              preferences={preferences}
            />
          ))}
        </ul>
      ) : (
        <p
          aria-live="polite"
          className="rounded-lg border border-muted-background bg-surface px-5 py-4 font-sans text-sm text-muted"
        >
          No Jingdex decks match “{query.trim()}”.
        </p>
      )}
    </div>
  );
}
