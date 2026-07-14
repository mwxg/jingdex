import { normalizeLanguagePreferences } from "@/lib/preferences/language";
import { getViewer } from "@/lib/auth/viewer";
import { DeckManager, type PersonalDeck } from "./deck-manager";
import { getPersonalDecks } from "./data";

export default async function MyDecksPage() {
  const [decks, { profile }] = await Promise.all([
    getPersonalDecks(),
    getViewer(),
  ]);

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="font-sans text-sm font-bold uppercase text-primary">My stuff</p>
        <h1 className="font-heading text-5xl font-semibold leading-none sm:text-6xl">My Decks</h1>
        <p className="max-w-3xl font-heading text-2xl font-semibold text-muted sm:text-3xl">
          Create decks for any category you can dream of.
        </p>
      </header>

      <DeckManager decks={decks as PersonalDeck[]} preferences={normalizeLanguagePreferences(profile)} />
    </div>
  );
}
