import Link from "next/link";
import { notFound } from "next/navigation";
import { DeckBrowser } from "@/app/(app)/community/[deckId]/deck-browser";
import { hasPermission } from "@/lib/auth/roles";
import { getViewer } from "@/lib/auth/viewer";
import { normalizeLanguagePreferences } from "@/lib/preferences/language";
import { DeckReviewForm } from "../../review-form";
import { getReviewDeck } from "../../data";
import { UsernameLink } from "@/components/username-link";

export default async function DeckReviewPage({
  params,
}: Readonly<{ params: Promise<{ deckId: string }> }>) {
  const { deckId } = await params;
  const [{ profile }, deck] = await Promise.all([
    getViewer(),
    getReviewDeck(deckId),
  ]);

  if (!hasPermission(profile?.role, "manageCommunityDecks")) notFound();
  if (!deck) notFound();

  const statusLabel = {
    under_review: "Awaiting review",
    approved: "Accepted",
    rejected: "Rejected",
  }[deck.publication_status];

  return (
    <main className="min-w-0 bg-background text-foreground">
      <div className="space-y-8">
        <Link className="inline-flex h-10 items-center rounded-lg border border-muted-background bg-surface px-4 font-sans text-sm font-bold transition-colors hover:border-admin hover:text-admin" href="/community/review">Back to review queue</Link>
        <header className="space-y-3">
          <p className="font-sans text-sm font-bold uppercase text-admin">Deck review · {statusLabel}</p>
          <h1 className="font-heading text-5xl font-semibold leading-none sm:text-6xl">{deck.title}</h1>
          <div className="flex flex-wrap gap-x-3 gap-y-1 font-sans text-sm text-muted">
            <span>{deck.term_count} {deck.term_count === 1 ? "term" : "terms"}</span>
            <span aria-hidden="true">/</span>
            <span>
              By <UsernameLink username={deck.created_by} />
            </span>
          </div>
          <p className="max-w-3xl font-sans text-lg leading-8 text-muted">{deck.description}</p>
        </header>

        <DeckBrowser deck={deck} preferences={normalizeLanguagePreferences(profile)} />

        {deck.publication_status === "under_review" ? (
          <section aria-labelledby="deck-decision-title" className="rounded-lg border border-muted-background bg-surface p-5 sm:p-6">
            <h2 className="font-heading text-3xl font-semibold" id="deck-decision-title">Review decision</h2>
            <DeckReviewForm deckId={deck.id} />
          </section>
        ) : deck.review_notes ? (
          <p className="rounded-lg border border-muted-background bg-surface p-5 font-sans text-sm text-muted"><span className="font-bold text-foreground">Reviewer notes:</span> {deck.review_notes}</p>
        ) : null}
      </div>
    </main>
  );
}
