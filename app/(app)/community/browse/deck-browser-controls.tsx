"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { InlineLoadingStatus } from "@/components/loading";
import { type LanguagePreferences } from "@/lib/preferences/language";
import { CommunityDeckCard } from "../deck-card";
import { type CommunityDeckSummary, type PublicDeckSort } from "../data";
import { searchPublicDecks } from "./actions";

type PublicDeckState = {
  decks: CommunityDeckSummary[];
  message: string | null;
  page: number;
  totalCount: number;
  totalPages: number;
};

function browseUrl(query: string, sort: PublicDeckSort, page = 1) {
  const params = new URLSearchParams();
  const normalizedQuery = query.trim();
  if (normalizedQuery) params.set("q", normalizedQuery);
  if (sort !== "alphabetical") params.set("sort", sort);
  if (page > 1) params.set("page", String(page));
  const queryString = params.toString();
  return `/community/browse${queryString ? `?${queryString}` : ""}`;
}

function visiblePages(page: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const start = Math.min(Math.max(page - 3, 1), totalPages - 6);
  return Array.from({ length: 7 }, (_, index) => start + index);
}

export function PublicDeckBrowser({
  initialQuery,
  initialSort,
  initialState,
  preferences,
}: Readonly<{
  initialQuery: string;
  initialSort: PublicDeckSort;
  initialState: PublicDeckState;
  preferences: LanguagePreferences;
}>) {
  const [query, setQuery] = useState(initialQuery);
  const [sort, setSort] = useState(initialSort);
  const [state, setState] = useState(initialState);
  const [isPending, startTransition] = useTransition();
  const requestId = useRef(0);
  const lastSearch = useRef({ query: initialQuery, sort: initialSort });

  const runSearch = useCallback(
    (nextQuery: string, nextSort: PublicDeckSort, nextPage = 1) => {
      const currentRequestId = requestId.current + 1;
      requestId.current = currentRequestId;

      window.history.replaceState(
        null,
        "",
        browseUrl(nextQuery, nextSort, nextPage),
      );

      startTransition(async () => {
        const nextState = await searchPublicDecks(
          nextQuery,
          nextSort,
          nextPage,
        );

        if (requestId.current === currentRequestId) {
          setState(nextState);
        }
      });
    },
    [],
  );

  useEffect(() => {
    if (
      query.trim() === lastSearch.current.query &&
      sort === lastSearch.current.sort
    ) {
      return;
    }

    const timeout = window.setTimeout(() => {
      lastSearch.current = { query: query.trim(), sort };
      runSearch(query, sort);
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [query, runSearch, sort]);

  const { decks, message, page, totalCount, totalPages } = state;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 rounded-lg border border-muted-background bg-surface p-4 sm:grid-cols-[minmax(0,1fr)_14rem] sm:p-6">
        <label className="space-y-2">
          <span className="block font-sans text-sm font-bold text-foreground">
            Search public decks
          </span>
          <input
            className="h-12 w-full rounded-lg border border-muted-background bg-surface px-4 font-sans text-base text-foreground outline-none placeholder:text-muted focus:border-primary"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by deck name"
            type="search"
            value={query}
          />
        </label>
        <label className="space-y-2">
          <span className="block font-sans text-sm font-bold text-foreground">
            Sort by
          </span>
          <select
            className="h-12 w-full rounded-lg border border-muted-background bg-surface px-4 font-sans text-base text-foreground outline-none focus:border-primary"
            onChange={(event) =>
              setSort(event.target.value as PublicDeckSort)
            }
            value={sort}
          >
            <option value="alphabetical">Alphabetically</option>
            <option value="latest">Latest</option>
            <option value="oldest">Oldest to newest</option>
          </select>
        </label>
      </div>

      <div className="flex min-h-5 flex-wrap items-center gap-x-4 gap-y-2">
        <p aria-live="polite" className="font-sans text-sm text-muted">
          {totalCount} {totalCount === 1 ? "deck" : "decks"}
        </p>
        {isPending ? <InlineLoadingStatus label="Updating decks…" /> : null}
      </div>

      {message ? (
        <p className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 font-sans text-sm font-bold text-danger">
          {message}
        </p>
      ) : null}

      <div
        aria-busy={isPending}
        className={`transition-opacity ${isPending ? "opacity-60" : "opacity-100"}`}
      >
        {decks.length > 0 ? (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {decks.map((deck) => (
              <CommunityDeckCard
                deck={deck}
                key={deck.id}
                preferences={preferences}
              />
            ))}
          </ul>
        ) : !message ? (
          <p className="rounded-lg border border-muted-background bg-surface px-5 py-4 font-sans text-sm text-muted">
            {query.trim()
              ? `No public decks match “${query.trim()}”.`
              : "No public decks are available yet."}
          </p>
        ) : null}
      </div>

      {totalPages > 1 ? (
        <nav
          aria-label="Deck pages"
          className="flex flex-wrap items-center justify-center gap-2 font-sans text-sm font-bold"
        >
          {page > 1 ? (
            <button
              className="flex h-10 items-center rounded-lg border border-muted-background bg-surface px-4 text-foreground hover:border-primary hover:text-primary disabled:cursor-wait disabled:opacity-60"
              disabled={isPending}
              onClick={() => runSearch(query, sort, page - 1)}
              type="button"
            >
              Previous
            </button>
          ) : null}
          {visiblePages(page, totalPages).map((pageNumber) => (
            <button
              aria-current={pageNumber === page ? "page" : undefined}
              className={`flex h-10 min-w-10 items-center justify-center rounded-lg border px-3 ${pageNumber === page ? "border-primary bg-primary text-text-light" : "border-muted-background bg-surface text-foreground hover:border-primary hover:text-primary"}`}
              disabled={isPending || pageNumber === page}
              key={pageNumber}
              onClick={() => runSearch(query, sort, pageNumber)}
              type="button"
            >
              {pageNumber}
            </button>
          ))}
          {page < totalPages ? (
            <button
              className="flex h-10 items-center rounded-lg border border-muted-background bg-surface px-4 text-foreground hover:border-primary hover:text-primary disabled:cursor-wait disabled:opacity-60"
              disabled={isPending}
              onClick={() => runSearch(query, sort, page + 1)}
              type="button"
            >
              Next
            </button>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}
