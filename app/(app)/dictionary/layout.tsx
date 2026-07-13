import { DictionaryNav } from "./dictionary-nav";

export default function DictionaryLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="flex-1 bg-background text-foreground">
      <div className="mx-auto grid min-h-[calc(100dvh-4rem)] max-w-352 gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:px-8">
        <aside className="border-b border-muted-background pb-4 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-6">
          <DictionaryNav />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </main>
  );
}
