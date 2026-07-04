import { DictionarySearch } from "./dictionary-search";
import { normalizeLanguagePreferences } from "@/lib/preferences/language";
import { createClient } from "@/lib/supabase/server";

export default async function DictionaryPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  const userId = authData?.claims?.sub ?? null;
  const { data: profile } = userId
    ? await supabase
        .from("profiles")
        .select("preferred_character_set,preferred_pronunciation")
        .eq("id", userId)
        .maybeSingle()
    : { data: null };
  const preferences = normalizeLanguagePreferences(profile);

  return (
    <main className="flex-1 bg-background px-6 py-10 text-foreground">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="space-y-3">
          <p className="font-sans text-sm font-bold uppercase text-primary">
            Dictionary
          </p>
          <h1 className="font-heading text-5xl font-semibold leading-none sm:text-6xl">
            Search Chinese terms
          </h1>
          <h3 className="font-heading text-3xl text-muted font-semibold leading-none sm:text-3xl">
            Explore our expanding, community-driven Chinese dictionary.
          </h3>
        </header>

        <DictionarySearch preferences={preferences} />
      </div>
    </main>
  );
}
