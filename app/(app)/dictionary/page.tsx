import { DictionarySearch } from "./dictionary-search";

export default function DictionaryPage() {
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

        <DictionarySearch />
      </div>
    </main>
  );
}
