import Link from "next/link";

export default function SettingsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="flex-1 bg-background text-foreground">
      <div className="mx-auto grid min-h-[calc(100dvh-4rem)] max-w-6xl gap-8 px-6 py-8 md:grid-cols-[15rem_1fr]">
        <aside className="border-b border-muted-background pb-4 md:border-b-0 md:border-r md:pb-0 md:pr-6">
          <nav aria-label="Settings" className="font-sans text-sm font-bold">
            <Link
              href="/settings/account"
              className="block rounded-lg bg-primary px-4 py-3 text-text-light transition-colors hover:bg-primary/90"
            >
              Account settings
            </Link>
          </nav>
        </aside>

        <div>{children}</div>
      </div>
    </main>
  );
}
