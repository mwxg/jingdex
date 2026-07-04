export default function LoadingCommunityDeck() {
  return (
    <main className="flex-1 bg-background px-6 py-10 text-foreground">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="h-10 w-40 rounded-lg bg-muted-background" />
        <div className="space-y-3">
          <div className="h-4 w-32 rounded bg-muted-background" />
          <div className="h-14 w-full max-w-xl rounded bg-muted-background" />
          <div className="h-5 w-56 rounded bg-muted-background" />
        </div>
        <section className="rounded-lg border border-muted-background bg-surface p-6">
          <div className="h-96 rounded-lg bg-muted-background" />
        </section>
      </div>
    </main>
  );
}
