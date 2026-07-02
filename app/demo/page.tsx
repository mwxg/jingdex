const studyItems = [
  { hanzi: "学习", pinyin: "xuéxí", meaning: "to study", status: "New" },
  { hanzi: "复习", pinyin: "fùxí", meaning: "to review", status: "Due" },
  { hanzi: "记得", pinyin: "jìde", meaning: "to remember", status: "Done" },
];

const deckStats = [
  { label: "New cards", value: "18" },
  { label: "Due today", value: "42" },
  { label: "Streak", value: "7" },
];

const pinyinInputs = [
  { input: "xue2xi2", display: "xuéxí" },
  { input: "xuéxí", display: "xuéxí" },
  { input: "fu4xi2", display: "fùxí" },
  { input: "fùxí", display: "fùxí" },
  { input: "ji4de", display: "jìde" },
  { input: "jìde", display: "jìde" },
  { input: "ma5", display: "ma" },
  { input: "nv3", display: "nǚ" },
  { input: "nǚ", display: "nǚ" },
  { input: "lü4", display: "lǜ" },
  { input: "lǜ", display: "lǜ" },
];

function Section({
  title,
  children,
}: Readonly<{
  title: string;
  children: React.ReactNode;
}>) {
  return (
    <section className="space-y-4">
      <h2 className="font-heading text-3xl font-semibold text-foreground">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Button({
  children,
  variant = "primary",
}: Readonly<{
  children: React.ReactNode;
  variant?: "primary" | "accent" | "quiet" | "danger" | "confirm";
}>) {
  const variants = {
    primary: "bg-primary text-text-light hover:bg-primary/90",
    accent: "bg-accent text-text-dark hover:bg-accent/85",
    quiet:
      "border border-muted-background bg-surface text-foreground hover:border-primary hover:text-primary",
    danger: "bg-danger text-text-light hover:bg-danger/90",
    confirm: "bg-confirm text-text-light hover:bg-confirm/90",
  };

  return (
    <button
      type="button"
      className={`h-11 rounded-lg px-5 font-sans text-sm font-bold transition-colors ${variants[variant]}`}
    >
      {children}
    </button>
  );
}

export default function Demo() {
  return (
    <main className="flex-1 bg-background px-6 py-10 text-foreground">
      <div className="mx-auto max-w-6xl space-y-12">
        <header className="space-y-3">
          <p className="font-sans text-sm font-bold uppercase text-primary">
            Jingdex demo
          </p>
          <h1 className="font-heading text-5xl font-semibold leading-none sm:text-6xl">
            Interface guide
          </h1>
          <p className="max-w-2xl font-sans text-lg leading-8 text-muted">
            A working set of base elements for flashcards, study sessions, and
            vocabulary review.
          </p>
        </header>

        <Section title="Buttons">
          <div className="flex flex-wrap gap-3">
            <Button>Start review</Button>
            <Button variant="accent">Add card</Button>
            <Button variant="quiet">Save draft</Button>
            <Button variant="confirm">Done</Button>
            <Button variant="danger">Cancel</Button>
          </div>
        </Section>

        <Section title="Fields">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="block font-sans text-sm font-bold text-foreground">
                Hanzi
              </span>
              <input
                className="h-12 w-full rounded-lg border border-muted-background bg-surface px-4 font-chinese text-base font-normal text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary"
                placeholder="精"
                type="text"
              />
            </label>
            <label className="space-y-2">
              <span className="block font-sans text-sm font-bold text-foreground">
                Pinyin
              </span>
              <input
                className="h-12 w-full rounded-lg border border-muted-background bg-surface px-4 font-sans text-base text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary"
                placeholder="jing1 or jīng"
                type="text"
              />
            </label>
            <label className="space-y-2 md:col-span-2">
              <span className="block font-sans text-sm font-bold text-foreground">
                Notes
              </span>
              <textarea
                className="min-h-28 w-full resize-y rounded-lg border border-muted-background bg-surface px-4 py-3 font-sans text-base leading-7 text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary"
                placeholder="Add a sentence, mnemonic, or grammar note."
              />
            </label>
          </div>
        </Section>

        <Section title="Cards">
          <div className="grid gap-4 md:grid-cols-3">
            {deckStats.map((stat) => (
              <article
                key={stat.label}
                className="rounded-lg border border-muted-background bg-surface p-5"
              >
                <p className="font-sans text-sm font-bold text-muted">
                  {stat.label}
                </p>
                <p className="mt-3 font-heading text-5xl font-semibold text-foreground">
                  {stat.value}
                </p>
              </article>
            ))}
          </div>
        </Section>

        <Section title="Pinyin inputs">
          <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
            <div className="rounded-lg border border-muted-background bg-surface p-5">
              <h3 className="font-heading text-2xl font-semibold text-foreground">
                Display rule
              </h3>
              <p className="mt-3 font-sans text-base leading-7 text-muted">
                Show tone marks in the interface. Accept tone numbers and
                marked pinyin while editing cards.
              </p>
            </div>

            <div className="overflow-hidden rounded-lg border border-muted-background bg-surface">
              <div className="grid grid-cols-2 border-b border-muted-background bg-muted-background px-5 py-3 font-sans text-sm font-bold text-muted">
                <span>Accepted input</span>
                <span>Display</span>
              </div>
              <ul className="divide-y divide-muted-background">
                {pinyinInputs.map((item) => (
                  <li
                    key={`${item.input}-${item.display}`}
                    className="grid grid-cols-2 px-5 py-4 font-sans text-base"
                  >
                    <code className="text-foreground">{item.input}</code>
                    <span className="font-bold text-primary">
                      {item.display}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Section>

        <Section title="Lists">
          <div className="overflow-hidden rounded-lg border border-muted-background bg-surface">
            <ul className="divide-y divide-muted-background">
              {studyItems.map((item) => (
                <li
                  key={item.hanzi}
                  className="grid gap-3 px-5 py-4 sm:grid-cols-[8rem_1fr_auto] sm:items-center"
                >
                  <div>
                    <p className="font-chinese text-3xl font-bold text-foreground">
                      {item.hanzi}
                    </p>
                    <p className="font-sans text-sm text-muted">
                      {item.pinyin}
                    </p>
                  </div>
                  <p className="font-sans text-base text-foreground">
                    {item.meaning}
                  </p>
                  <span className="w-fit rounded-full bg-muted-background px-3 py-1 font-sans text-xs font-bold text-muted">
                    {item.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Section>

        <Section title="Review panel">
          <div className="grid gap-6 rounded-lg border border-muted-background bg-surface p-6 lg:grid-cols-[1fr_18rem]">
            <div>
              <p className="font-sans text-sm font-bold uppercase text-accent">
                Vocabulary
              </p>
              <h3 className="mt-3 font-chinese text-6xl font-bold text-foreground">
                练习
              </h3>
              <p className="mt-4 max-w-xl font-sans text-lg leading-8 text-muted">
                Practice pairs recognition with recall. Mark each answer after
                speaking it out loud.
              </p>
            </div>
            <div className="flex flex-col justify-end gap-3">
              <Button variant="confirm">I knew it</Button>
              <Button variant="quiet">Review again</Button>
              <Button variant="danger">I missed it</Button>
            </div>
          </div>
        </Section>
      </div>
    </main>
  );
}
