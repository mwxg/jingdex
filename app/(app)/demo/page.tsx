import type { ReactNode } from "react";
import {
  InlineLoadingStatus,
  PendingLabel,
  Skeleton,
} from "@/components/loading";
import { PageHeader } from "@/components/page-header";
import { PopupDemo } from "./popup-demo";

const buttonBase =
  "inline-flex h-11 items-center justify-center rounded-lg px-5 font-sans text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50";
const fieldBase =
  "h-12 w-full rounded-lg border border-muted-background bg-surface px-4 font-sans text-base text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary";

const terms = [
  {
    characters: "学习 / 學習",
    definition: "to study; to learn",
    pronunciation: "xuéxí · ㄒㄩㄝˊ ㄒㄧˊ",
    status: "New",
  },
  {
    characters: "复习 / 複習",
    definition: "to review",
    pronunciation: "fùxí · ㄈㄨˋ ㄒㄧˊ",
    status: "Due",
  },
  {
    characters: "记得 / 記得",
    definition: "to remember",
    pronunciation: "jìde · ㄐㄧˋ ˙ㄉㄜ",
    status: "Learned",
  },
];

function DemoSection({
  children,
  description,
  title,
}: Readonly<{
  children: ReactNode;
  description: string;
  title: string;
}>) {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="font-heading text-3xl font-semibold text-foreground">
          {title}
        </h2>
        <p className="max-w-3xl font-sans text-sm leading-6 text-muted">
          {description}
        </p>
      </div>
      {children}
    </section>
  );
}

function Swatch({
  className,
  label,
}: Readonly<{ className: string; label: string }>) {
  return (
    <li className="flex items-center gap-3 rounded-lg border border-muted-background bg-surface p-3">
      <span
        aria-hidden="true"
        className={`size-10 shrink-0 rounded-lg border border-foreground/10 ${className}`}
      />
      <span className="font-sans text-sm font-bold text-foreground">
        {label}
      </span>
    </li>
  );
}

export default function DemoPage() {
  return (
    <main className="min-w-0 bg-background text-foreground">
      <div className="w-full space-y-12">
        <PageHeader
          description="A static reference for the typography, controls, feedback, cards, and study surfaces used throughout Jingdex."
          eyebrow="Jingdex demo"
          title="Interface guide"
        />

        <DemoSection
          description="Semantic colors adapt with the selected theme; typography keeps interface text and Chinese content distinct."
          title="Foundations"
        >
          <div className="grid gap-4 xl:grid-cols-[1.1fr_1fr]">
            <article className="rounded-lg border border-muted-background bg-surface p-5 sm:p-6">
              <p className="font-sans text-xs font-bold uppercase tracking-wide text-primary">
                Typography
              </p>
              <h3 className="mt-3 font-heading text-4xl font-semibold leading-none">
                Clear hierarchy
              </h3>
              <p className="mt-3 max-w-xl font-sans leading-7 text-muted">
                Body copy stays straightforward and readable, while the slab
                serif gives page and section headings their Jingdex character.
              </p>
              <p className="mt-5 font-chinese text-4xl font-bold leading-tight">
                精进中文 · 精進中文
              </p>
              <p className="mt-1 font-sans text-sm text-muted">
                jīngjìn zhōngwén · ㄐㄧㄥ ㄐㄧㄣˋ ㄓㄨㄥ ㄨㄣˊ
              </p>
            </article>

            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Swatch className="bg-background" label="Background" />
              <Swatch className="bg-surface" label="Surface" />
              <Swatch className="bg-muted-background" label="Muted" />
              <Swatch className="bg-primary" label="Primary" />
              <Swatch className="bg-accent" label="Accent" />
              <Swatch className="bg-confirm" label="Confirm" />
              <Swatch className="bg-danger" label="Danger" />
              <Swatch className="bg-community-deck" label="Community" />
              <Swatch className="bg-under-review" label="Under review" />
            </ul>
          </div>
        </DemoSection>

        <DemoSection
          description="Primary actions lead, outlined actions support, and semantic actions communicate their outcome without relying on color alone."
          title="Actions and feedback"
        >
          <div className="rounded-lg border border-muted-background bg-surface p-5 sm:p-6">
            <div className="flex flex-wrap gap-3">
              <button
                className={`${buttonBase} bg-primary text-on-primary hover:bg-primary/90`}
                type="button"
              >
                Start review
              </button>
              <button
                className={`${buttonBase} bg-accent text-text-dark hover:bg-accent/85`}
                type="button"
              >
                Add card
              </button>
              <button
                className={`${buttonBase} border border-muted-background bg-surface hover:border-primary hover:text-primary`}
                type="button"
              >
                Save draft
              </button>
              <button
                className={`${buttonBase} bg-confirm text-on-confirm hover:bg-confirm/90`}
                type="button"
              >
                Approve
              </button>
              <button
                className={`${buttonBase} bg-danger text-on-danger hover:bg-danger/90`}
                type="button"
              >
                Delete
              </button>
              <button
                className={`${buttonBase} bg-primary text-on-primary`}
                disabled
                type="button"
              >
                Disabled
              </button>
            </div>

            <div className="mt-6 grid gap-3 lg:grid-cols-3">
              <p
                className="rounded-lg border border-confirm/30 bg-confirm/10 px-4 py-3 text-sm font-bold text-confirm"
                role="status"
              >
                Your changes were saved.
              </p>
              <p className="rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm font-bold text-foreground">
                This deck has 12 cards due today.
              </p>
              <p
                className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm font-bold text-danger"
                role="alert"
              >
                A title is required.
              </p>
            </div>
          </div>
        </DemoSection>

        <DemoSection
          description="Labels remain visible, controls share a common height, and helper text explains formatting before validation is needed."
          title="Form controls"
        >
          <div className="grid gap-5 rounded-lg border border-muted-background bg-surface p-5 sm:grid-cols-2 sm:p-6">
            <label className="space-y-2">
              <span className="block text-sm font-bold">Simplified</span>
              <input className={`${fieldBase} font-chinese`} defaultValue="学习" />
            </label>
            <label className="space-y-2">
              <span className="block text-sm font-bold">Pronunciation</span>
              <input className={fieldBase} defaultValue="xuéxí" />
            </label>
            <label className="space-y-2">
              <span className="block text-sm font-bold">Part of speech</span>
              <select className={fieldBase} defaultValue="verb">
                <option value="noun">Noun</option>
                <option value="verb">Verb</option>
                <option value="adjective">Adjective</option>
              </select>
            </label>
            <fieldset className="space-y-2">
              <legend className="text-sm font-bold">Writing system</legend>
              <div className="flex min-h-12 flex-wrap items-center gap-x-5 gap-y-2 rounded-lg border border-muted-background bg-background px-4 py-2">
                <label className="inline-flex items-center gap-2 text-sm font-bold">
                  <input
                    className="size-4 accent-primary"
                    defaultChecked
                    name="demo-writing-system"
                    type="radio"
                  />
                  Simplified
                </label>
                <label className="inline-flex items-center gap-2 text-sm font-bold">
                  <input
                    className="size-4 accent-primary"
                    name="demo-writing-system"
                    type="radio"
                  />
                  Traditional
                </label>
              </div>
            </fieldset>
            <label className="space-y-2 sm:col-span-2">
              <span className="block text-sm font-bold">Definition</span>
              <textarea
                className="min-h-28 w-full resize-y rounded-lg border border-muted-background bg-surface px-4 py-3 font-sans leading-7 text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary"
                defaultValue="to study; to learn"
              />
              <span className="block text-sm leading-6 text-muted">
                Separate significantly different meanings with a new line.
              </span>
            </label>
          </div>
        </DemoSection>

        <DemoSection
          description="Cards use the same border, surface, radius, spacing, and metadata treatment across collections."
          title="Cards and states"
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <article className="rounded-lg border border-muted-background bg-surface p-5">
              <div className="flex min-h-40 items-center justify-center rounded-lg bg-muted-background px-4 py-6">
                <p className="text-center font-chinese text-6xl font-bold leading-none">
                  学习
                </p>
              </div>
              <div className="mt-5 space-y-3">
                <h3 className="font-heading text-2xl font-semibold leading-tight">
                  Everyday Chinese
                </h3>
                <p className="min-h-18 text-sm leading-6 text-muted">
                  Useful words and phrases for building a steady daily study
                  routine.
                </p>
                <div className="flex justify-between gap-3 border-t border-muted-background pt-3 text-sm text-muted">
                  <span>24 terms</span>
                  <span>By Jingdex</span>
                </div>
              </div>
            </article>

            <article className="rounded-lg border border-muted-background bg-surface p-5">
              <p className="text-sm font-bold text-muted">Due today</p>
              <p className="mt-3 font-heading text-5xl font-semibold">42</p>
              <div className="mt-8 flex flex-wrap gap-2">
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                  18 new
                </span>
                <span className="rounded-full bg-under-review/10 px-3 py-1 text-xs font-bold text-under-review">
                  12 learning
                </span>
                <span className="rounded-full bg-confirm/10 px-3 py-1 text-xs font-bold text-confirm">
                  12 review
                </span>
              </div>
            </article>

            <article className="rounded-lg border border-muted-background bg-surface p-6 text-muted md:col-span-2 xl:col-span-1">
              <h3 className="font-heading text-2xl font-semibold text-foreground">
                No personal decks yet
              </h3>
              <p className="mt-2 text-sm leading-6">
                Empty states explain what belongs here and offer a clear next
                step without changing the page structure.
              </p>
              <button
                className={`${buttonBase} mt-5 bg-primary text-on-primary hover:bg-primary/90`}
                type="button"
              >
                Create deck
              </button>
            </article>
          </div>
        </DemoSection>

        <DemoSection
          description="Chinese forms and pronunciation systems are paired equally here so the guide stays neutral to a viewer’s saved preference."
          title="Term list"
        >
          <div className="overflow-hidden rounded-lg border border-muted-background bg-surface">
            <div className="hidden grid-cols-[minmax(10rem,1fr)_minmax(11rem,1fr)_minmax(12rem,1.4fr)_auto] gap-3 border-b border-muted-background bg-muted-background px-5 py-3 text-sm font-bold text-muted sm:grid">
              <span>Term</span>
              <span>Pronunciation</span>
              <span>Definition</span>
              <span>Status</span>
            </div>
            <ul className="divide-y divide-muted-background">
              {terms.map((term) => (
                <li
                  className="grid gap-2 px-5 py-4 sm:grid-cols-[minmax(10rem,1fr)_minmax(11rem,1fr)_minmax(12rem,1.4fr)_auto] sm:items-center sm:gap-3"
                  key={term.characters}
                >
                  <span className="font-chinese text-2xl font-bold">
                    {term.characters}
                  </span>
                  <span className="text-sm text-muted">
                    {term.pronunciation}
                  </span>
                  <span className="text-sm leading-6">{term.definition}</span>
                  <span className="w-fit rounded-full bg-muted-background px-3 py-1 text-xs font-bold text-muted">
                    {term.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </DemoSection>

        <DemoSection
          description="Loading UI preserves the shape of incoming content, announces progress, and respects reduced-motion preferences."
          title="Loading"
        >
          <div className="grid gap-4 rounded-lg border border-muted-background bg-surface p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div aria-hidden="true" className="space-y-3">
              <Skeleton className="h-8 w-2/3 max-w-sm" />
              <Skeleton className="h-4 w-full max-w-xl" />
              <Skeleton className="h-4 w-4/5 max-w-lg" />
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <InlineLoadingStatus label="Loading cards…" />
              <button
                aria-busy="true"
                className={`${buttonBase} bg-primary text-on-primary`}
                disabled
                type="button"
              >
                <PendingLabel>Saving…</PendingLabel>
              </button>
            </div>
          </div>
        </DemoSection>

        <DemoSection
          description="Dialogs use the same surface, border, spacing, close target, and text hierarchy as the rest of the app."
          title="Dialog"
        >
          <PopupDemo />
        </DemoSection>
      </div>
    </main>
  );
}
