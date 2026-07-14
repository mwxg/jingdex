import Link from "next/link";
import { normalizeLanguagePreferences } from "@/lib/preferences/language";
import { getViewer } from "@/lib/auth/viewer";
import { getAllJingdexDecks } from "../data";
import { JingdexDeckSearch } from "./deck-search";
import { PageHeader } from "@/components/page-header";

export default async function JingdexDecksPage() {
  const [{ profile }, deckState] = await Promise.all([
    getViewer(),
    getAllJingdexDecks(),
  ]);
  const preferences = normalizeLanguagePreferences(profile);

  return (
    <main className="flex-1 bg-background text-foreground">
      <div className="w-full space-y-8">
        <PageHeader
          description="Browse Chinese vocabulary decks created by Jingdex."
          eyebrow={
            <Link className="hover:text-foreground" href="/community/featured">
              ← Community
            </Link>
          }
          title="Decks by Jingdex"
        />

        {deckState.message ? <p className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 font-sans text-sm font-bold text-danger">{deckState.message}</p> : null}

        {deckState.decks.length > 0 ? (
          <JingdexDeckSearch decks={deckState.decks} preferences={preferences} />
        ) : !deckState.message ? (
          <p className="rounded-lg border border-muted-background bg-surface px-5 py-4 font-sans text-sm text-muted">
            No Jingdex decks are available yet.
          </p>
        ) : null}
      </div>
    </main>
  );
}
