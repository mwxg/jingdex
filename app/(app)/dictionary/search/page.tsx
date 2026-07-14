import { DictionarySearch } from "../dictionary-search";
import { normalizeLanguagePreferences } from "@/lib/preferences/language";
import { getViewer } from "@/lib/auth/viewer";

export default async function DictionarySearchPage() {
  const { profile } = await getViewer();

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="font-sans text-sm font-bold uppercase text-primary">Dictionary</p>
        <h1 className="font-heading text-5xl font-semibold leading-none sm:text-6xl">
          Search Chinese terms
        </h1>
        <p className="font-heading text-2xl font-semibold text-muted sm:text-3xl">
          Explore our expanding, community-driven Chinese dictionary.
        </p>
      </header>
      <DictionarySearch preferences={normalizeLanguagePreferences(profile)} />
    </div>
  );
}
