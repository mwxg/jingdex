import { createClient } from "@/lib/supabase/server";
import { normalizeLanguagePreferences } from "@/lib/preferences/language";
import { DeckManager, type PersonalDeck } from "./deck-manager";

export default async function MyDecksPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  const userId = authData?.claims?.sub;
  const [{ data: decks }, { data: profile }] = await Promise.all([
    supabase.from("decks").select("id,title,description,updated_at,deck_terms(count)")
      .eq("created_by_user_id", userId!).eq("visibility", "private")
      .order("updated_at", { ascending: false }),
    supabase.from("profiles").select("preferred_character_set,preferred_pronunciation")
      .eq("id", userId!).maybeSingle(),
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

      <DeckManager decks={(decks ?? []) as PersonalDeck[]} preferences={normalizeLanguagePreferences(profile)} />
    </div>
  );
}
