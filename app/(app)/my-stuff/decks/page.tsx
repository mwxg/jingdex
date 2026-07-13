export default function MyDecksPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="font-sans text-sm font-bold uppercase text-primary">My stuff</p>
        <h1 className="font-heading text-5xl font-semibold leading-none sm:text-6xl">My Decks</h1>
        <p className="max-w-3xl font-heading text-2xl font-semibold text-muted sm:text-3xl">
          Create decks for any category you can dream of.
        </p>
      </header>

      <p className="rounded-lg border border-muted-background bg-surface p-5 font-sans text-muted">
        You do not have any personal decks yet.
      </p>
    </div>
  );
}
