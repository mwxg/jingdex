import { normalizeLanguagePreferences } from "@/lib/preferences/language";
import { getViewer } from "@/lib/auth/viewer";
import { DeckManager, type PersonalDeck } from "./deck-manager";
import { getPersonalDecks } from "./data";
import { PageHeader } from "@/components/page-header";

export default async function MyDecksPage() {
  const [decks, { profile }] = await Promise.all([
    getPersonalDecks(),
    getViewer(),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        description="Create decks for any category you can dream of."
        eyebrow="My stuff"
        title="My decks"
      />

      <DeckManager decks={decks as PersonalDeck[]} preferences={normalizeLanguagePreferences(profile)} />
    </div>
  );
}
