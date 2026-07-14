import { normalizeLanguagePreferences } from "@/lib/preferences/language";
import { getViewer } from "@/lib/auth/viewer";
import { getPublicDecks, type PublicDeckSort } from "../data";
import { PublicDeckBrowser } from "./deck-browser-controls";

type BrowseSearchParams = {
  page?: string | string[];
  q?: string | string[];
  sort?: string | string[];
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function BrowseCommunityDecksPage({
  searchParams,
}: Readonly<{ searchParams: Promise<BrowseSearchParams> }>) {
  const params = await searchParams;
  const query = first(params.q).trim().normalize("NFC");
  const requestedSort = first(params.sort);
  const sort: PublicDeckSort = ["latest", "oldest"].includes(requestedSort)
    ? requestedSort as PublicDeckSort
    : "alphabetical";
  const parsedPage = Number.parseInt(first(params.page), 10);
  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const [{ profile }, deckState] = await Promise.all([
    getViewer(),
    getPublicDecks({ page, query, sort }),
  ]);
  const preferences = normalizeLanguagePreferences(profile);

  return (
    <main className="flex-1 bg-background text-foreground">
      <div className="w-full space-y-8">
        <header className="space-y-3">
          <p className="font-sans text-sm font-bold uppercase text-primary">Community</p>
          <h1 className="font-heading text-5xl font-semibold leading-none sm:text-6xl">Browse decks</h1>
          <p className="max-w-3xl font-sans text-lg text-muted">Search all public Chinese vocabulary decks shared by the community.</p>
        </header>

        <PublicDeckBrowser
          initialQuery={query}
          initialSort={sort}
          initialState={deckState}
          preferences={preferences}
        />
      </div>
    </main>
  );
}
