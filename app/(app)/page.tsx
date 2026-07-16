import Link from "next/link";

const primaryLink =
  "inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 py-3 text-center text-sm font-bold text-text-dark transition-colors hover:bg-primary/90";
const secondaryLink =
  "inline-flex min-h-11 items-center justify-center rounded-lg border border-muted-background bg-surface px-5 py-3 text-center text-sm font-bold text-foreground transition-colors hover:border-primary hover:text-muted";

const contributionSteps = [
  {
    number: "1",
    title: "Share what you know",
    description: "Suggest a missing word or build a vocabulary deck around a topic you care about.",
  },
  {
    number: "2",
    title: "Reviewed for quality",
    description: "Admins review community submissions before they become part of the public collection.",
  },
  {
    number: "3",
    title: "Useful to everyone",
    description: "Approved words and decks become resources that the whole community can learn from.",
  },
] as const;

export default function Home() {
  return (
    <main className="bg-background text-foreground">
      <section className="border-b border-muted-background">
        <div className="mx-auto max-w-5xl px-4 py-20 text-center sm:px-6 sm:py-28">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">
            Built by Chinese learners
          </p>
          <h1 className="mx-auto mt-4 max-w-4xl font-heading text-5xl font-semibold leading-[1.02] tracking-tight sm:text-7xl">
            A Chinese dictionary built together.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-muted sm:text-lg sm:leading-8">
            Jingdex grows through its community. Learners contribute words and
            create vocabulary decks, while careful review helps keep every
            public resource useful and trustworthy.
          </p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link className={primaryLink} href="/dictionary/contribute">
              Contribute a word
            </Link>
            <Link className={secondaryLink} href="/community/browse">
              Browse community decks
            </Link>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="community-resources-title"
        className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24"
      >
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">
            Learn from the community
          </p>
          <h2
            className="mt-3 font-heading text-4xl font-semibold leading-tight sm:text-5xl"
            id="community-resources-title"
          >
            Made by learners, for learners.
          </h2>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <article className="flex flex-col rounded-lg border border-muted-background bg-surface p-6 sm:p-8">
            <div
              aria-hidden="true"
              className="flex size-12 items-center justify-center rounded-lg bg-primary/15 font-chinese text-2xl font-bold"
            >
              字
            </div>
            <h3 className="mt-6 font-heading text-3xl font-semibold">
              Community dictionary
            </h3>
            <p className="mt-3 flex-1 leading-7 text-muted">
              Look up Chinese words contributed by people who learn and use
              them. If something is missing, you can suggest it for review.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link className={primaryLink} href="/dictionary/search">
                Search the dictionary
              </Link>
              <Link className={secondaryLink} href="/dictionary/contribute">
                Add a word
              </Link>
            </div>
          </article>

          <article className="flex flex-col rounded-lg border border-muted-background bg-surface p-6 sm:p-8">
            <div
              aria-hidden="true"
              className="flex size-12 items-center justify-center rounded-lg bg-community-deck/10 font-chinese text-2xl font-bold text-community-deck"
            >
              集
            </div>
            <h3 className="mt-6 font-heading text-3xl font-semibold">
              Community decks
            </h3>
            <p className="mt-3 flex-1 leading-7 text-muted">
              Discover focused vocabulary collections made by other users, or
              create and submit a deck that fills a gap you have found.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link className={primaryLink} href="/community/browse">
                Browse decks
              </Link>
              <Link className={secondaryLink} href="/my-stuff/decks">
                Create a deck
              </Link>
            </div>
          </article>
        </div>
      </section>

      <section className="border-y border-muted-background bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">
              How contributions work
            </p>
            <h2 className="mt-3 font-heading text-4xl font-semibold leading-tight">
              Everyone can help Jingdex grow.
            </h2>
          </div>

          <ol className="mt-10 grid gap-8 md:grid-cols-3">
            {contributionSteps.map((step) => (
              <li className="border-t border-muted-background pt-5" key={step.number}>
                <span className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-text-dark">
                  {step.number}
                </span>
                <h3 className="mt-5 font-heading text-2xl font-semibold">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted">
                  {step.description}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-7 px-4 py-16 sm:px-6 sm:py-20 lg:flex-row lg:items-center">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">
            Your own space
          </p>
          <h2 className="mt-3 font-heading text-3xl font-semibold sm:text-4xl">
            Keep the words that matter to you.
          </h2>
          <p className="mt-3 leading-7 text-muted">
            Build personal decks for your goals, then choose when you are ready
            to share them with the wider community.
          </p>
        </div>
        <Link
          className={`${secondaryLink} w-full shrink-0 sm:w-auto`}
          href="/my-stuff/decks"
        >
          Open my decks
        </Link>
      </section>
    </main>
  );
}
