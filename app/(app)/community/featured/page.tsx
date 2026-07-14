import Link from "next/link";
import { normalizeLanguagePreferences } from "@/lib/preferences/language";
import { getViewer } from "@/lib/auth/viewer";
import { getCommunityDecks } from "../data";
import { CommunityDeckCard } from "../deck-card";
import { PageHeader } from "@/components/page-header";

export default async function FeaturedCommunityPage() {
  const [{ profile }, deckState] = await Promise.all([
    getViewer(),
    getCommunityDecks(),
  ]);
  const preferences = normalizeLanguagePreferences(profile);

  return (
    <main className="flex-1 bg-background text-foreground">
      <div className="w-full space-y-8">
        <PageHeader
          description="Discover Chinese vocabulary decks selected by Jingdex."
          eyebrow="Community"
          title="Featured decks"
        />

        {deckState.message ? (
          <p className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 font-sans text-sm font-bold text-danger">{deckState.message}</p>
        ) : null}

        {deckState.decks.length > 0 ? (
          <section aria-labelledby="featured-decks-title" className="rounded-lg border border-muted-background bg-surface p-4 sm:p-6">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="font-heading text-2xl font-semibold text-foreground" id="featured-decks-title">Decks by Jingdex</h2>
              <Link className="font-sans text-sm font-bold text-primary transition-colors hover:text-foreground focus:outline-none focus-visible:underline" href="/community/jingdex">
                View all decks by Jingdex
              </Link>
            </div>
            <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {deckState.decks.map((deck) => (
                <CommunityDeckCard className="hidden first:block md:nth-[2]:block xl:nth-[3]:block" deck={deck} key={deck.id} preferences={preferences} />
              ))}
            </ul>
          </section>
        ) : !deckState.message ? (
          <p className="rounded-lg border border-muted-background bg-surface px-5 py-4 font-sans text-sm text-muted">No featured decks are available yet.</p>
        ) : null}
      </div>
    </main>
  );
}
