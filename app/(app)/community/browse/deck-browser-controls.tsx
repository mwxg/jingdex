"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { type LanguagePreferences } from "@/lib/preferences/language";
import { InlineLoadingStatus } from "@/components/loading";
import { type CommunityDeckSummary, type PublicDeckSort } from "../data";
import { CommunityDeckCard } from "../deck-card";

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
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);
  const start = Math.min(Math.max(page - 3, 1), totalPages - 6);
  return Array.from({ length: 7 }, (_, index) => start + index);
}

export function PublicDeckBrowser({
  decks,
  initialQuery,
  initialSort,
  page,
  preferences,
  totalCount,
  totalPages,
}: Readonly<{
  decks: CommunityDeckSummary[];
  initialQuery: string;
  initialSort: PublicDeckSort;
  page: number;
  preferences: LanguagePreferences;
  totalCount: number;
  totalPages: number;
}>) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (query.trim() === initialQuery) return;
    const timeout = window.setTimeout(() => {
      startTransition(() => router.replace(browseUrl(query, initialSort), { scroll: false }));
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [initialQuery, initialSort, query, router]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 rounded-lg border border-muted-background bg-surface p-4 sm:grid-cols-[minmax(0,1fr)_14rem] sm:p-6">
        <label className="space-y-2">
          <span className="block font-sans text-sm font-bold text-foreground">Search public decks</span>
          <input
            className="h-12 w-full rounded-lg border border-muted-background bg-surface px-4 font-sans text-base text-foreground outline-none placeholder:text-muted focus:border-primary"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by deck name"
            type="search"
            value={query}
          />
        </label>
        <label className="space-y-2">
          <span className="block font-sans text-sm font-bold text-foreground">Sort by</span>
          <select
            className="h-12 w-full rounded-lg border border-muted-background bg-surface px-4 font-sans text-base text-foreground outline-none focus:border-primary"
            onChange={(event) => {
              const nextSort = event.target.value as PublicDeckSort;
              startTransition(() => router.replace(browseUrl(query, nextSort), { scroll: false }));
            }}
            value={initialSort}
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

      <div aria-busy={isPending} className={`transition-opacity ${isPending ? "opacity-60" : "opacity-100"}`}>
        {decks.length > 0 ? (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {decks.map((deck) => (
              <CommunityDeckCard deck={deck} key={deck.id} preferences={preferences} />
            ))}
          </ul>
        ) : (
          <p className="rounded-lg border border-muted-background bg-surface px-5 py-4 font-sans text-sm text-muted">
            {initialQuery ? `No public decks match “${initialQuery}”.` : "No public decks are available yet."}
          </p>
        )}
      </div>

      {totalPages > 1 ? (
        <nav aria-label="Deck pages" className="flex flex-wrap items-center justify-center gap-2 font-sans text-sm font-bold">
          {page > 1 ? (
            <Link className="flex h-10 items-center rounded-lg border border-muted-background bg-surface px-4 text-foreground hover:border-primary hover:text-primary" href={browseUrl(initialQuery, initialSort, page - 1)}>Previous</Link>
          ) : null}
          {visiblePages(page, totalPages).map((pageNumber) => (
            <Link
              aria-current={pageNumber === page ? "page" : undefined}
              className={`flex h-10 min-w-10 items-center justify-center rounded-lg border px-3 ${pageNumber === page ? "border-primary bg-primary text-text-light" : "border-muted-background bg-surface text-foreground hover:border-primary hover:text-primary"}`}
              href={browseUrl(initialQuery, initialSort, pageNumber)}
              key={pageNumber}
            >
              {pageNumber}
            </Link>
          ))}
          {page < totalPages ? (
            <Link className="flex h-10 items-center rounded-lg border border-muted-background bg-surface px-4 text-foreground hover:border-primary hover:text-primary" href={browseUrl(initialQuery, initialSort, page + 1)}>Next</Link>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}
