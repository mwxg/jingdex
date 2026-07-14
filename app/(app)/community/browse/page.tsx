import { normalizeLanguagePreferences } from "@/lib/preferences/language";
import { getViewer } from "@/lib/auth/viewer";
import { getPublicDecks, type PublicDeckSort } from "../data";
import { PublicDeckBrowser } from "./deck-browser-controls";
import { PageHeader } from "@/components/page-header";

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
        <PageHeader
          description="Search all public Chinese vocabulary decks shared by the community."
          eyebrow="Community"
          title="Browse decks"
        />

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
