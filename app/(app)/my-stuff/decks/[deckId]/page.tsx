import Link from "next/link";
import { notFound } from "next/navigation";
import { DeckBrowser } from "@/app/(app)/community/[deckId]/deck-browser";
import { normalizeLanguagePreferences } from "@/lib/preferences/language";
import { getViewer } from "@/lib/auth/viewer";
import { getPersonalDeck } from "../data";

export default async function PersonalDeckPage({ params }: Readonly<{ params: Promise<{ deckId: string }> }>) {
  const { deckId } = await params;
  const { profile, userId } = await getViewer();
  if (!userId) return null;
  const deck = await getPersonalDeck(deckId);
  if (!deck) notFound();
  const isPublished = deck.visibility === "community" && deck.publication_status === "approved";
  const statusLabel = isPublished
    ? "Visible to the community"
    : deck.publication_status === "under_review"
      ? "Awaiting review"
      : deck.publication_status === "rejected"
        ? "Changes requested"
        : "Only visible to you";

  return <main className="flex-1 bg-background text-foreground"><div className="w-full space-y-8">
    <Link className="inline-flex h-10 items-center rounded-lg border border-muted-background bg-surface px-4 text-sm font-bold transition-colors hover:border-primary hover:text-primary" href="/my-stuff/decks">Back to my decks</Link>
    <header className="space-y-3">
      <p className="text-sm font-bold uppercase text-primary">{isPublished ? "Published deck" : "Personal deck"}</p>
      <h1 className="font-heading text-5xl font-semibold leading-none sm:text-6xl">{deck.title}</h1>
      <div className="flex items-center gap-2 text-sm text-muted"><span>{deck.term_count} {deck.term_count === 1 ? "term" : "terms"}</span><span>/</span><span>{statusLabel}</span></div>
      {deck.description ? <p className="max-w-3xl text-lg leading-8 text-muted">{deck.description}</p> : null}
    </header>
    <DeckBrowser deck={deck} preferences={normalizeLanguagePreferences(profile)} />
  </div></main>;
}
