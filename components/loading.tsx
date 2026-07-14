import type { ReactNode } from "react";

type ClassNameProps = Readonly<{
  className?: string;
}>;

function classes(...values: Array<string | undefined | false>) {
  return values.filter(Boolean).join(" ");
}

export function Skeleton({ className }: ClassNameProps) {
  return (
    <span
      aria-hidden="true"
      className={classes("loading-skeleton block rounded-lg", className)}
    />
  );
}

export function LoadingSpinner({ className }: ClassNameProps) {
  return (
    <span
      aria-hidden="true"
      className={classes("loading-spinner inline-block size-4 shrink-0", className)}
    />
  );
}

export function PendingLabel({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <span className="inline-flex items-center justify-center gap-2">
      <LoadingSpinner />
      <span>{children}</span>
    </span>
  );
}

export function InlineLoadingStatus({
  className,
  label,
}: Readonly<{
  className?: string;
  label: string;
}>) {
  return (
    <span
      aria-live="polite"
      className={classes(
        "inline-flex items-center gap-2 font-sans text-sm font-bold text-primary",
        className,
      )}
      role="status"
    >
      <LoadingSpinner />
      {label}
    </span>
  );
}

export function LoadingAnnouncement({ label }: Readonly<{ label: string }>) {
  return (
    <span aria-live="polite" className="sr-only" role="status">
      {label}
    </span>
  );
}

export function PageHeaderSkeleton({
  backLink = false,
  description = true,
}: Readonly<{
  backLink?: boolean;
  description?: boolean;
}>) {
  return (
    <header className="space-y-3">
      {backLink ? <Skeleton className="h-10 w-40" /> : null}
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-12 w-full max-w-lg sm:h-16" />
      {description ? <Skeleton className="h-7 w-full max-w-2xl" /> : null}
    </header>
  );
}

export function CardGridSkeleton({ count = 6 }: Readonly<{ count?: number }>) {
  return (
    <ul
      aria-hidden="true"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
    >
      {Array.from({ length: count }, (_, index) => (
        <li
          className="space-y-4 rounded-lg border border-muted-background bg-surface p-5"
          key={index}
        >
          <Skeleton className="h-8 w-2/3" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
          <Skeleton className="h-5 w-28" />
        </li>
      ))}
    </ul>
  );
}

export function ListSkeleton({ rows = 5 }: Readonly<{ rows?: number }>) {
  return (
    <div
      aria-hidden="true"
      className="overflow-hidden rounded-lg border border-muted-background bg-surface"
    >
      <Skeleton className="h-12 w-full rounded-none" />
      <ul className="divide-y divide-muted-background">
        {Array.from({ length: rows }, (_, index) => (
          <li className="grid gap-3 px-5 py-4 sm:grid-cols-[10rem_1fr_auto]" key={index}>
            <div className="space-y-2">
              <Skeleton className="h-7 w-28" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full max-w-md" />
              <Skeleton className="h-4 w-3/4 max-w-sm" />
            </div>
            <Skeleton className="h-7 w-20" />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CollectionPageSkeleton({
  cardCount = 6,
  contained = false,
  controls = true,
  label = "Loading content",
}: Readonly<{
  cardCount?: number;
  contained?: boolean;
  controls?: boolean;
  label?: string;
}>) {
  const content = (
    <>
      <LoadingAnnouncement label={label} />
      <div className="w-full space-y-8">
        <PageHeaderSkeleton />
        {controls ? (
          <div className="grid gap-4 rounded-lg border border-muted-background bg-surface p-4 sm:grid-cols-[minmax(0,1fr)_14rem] sm:p-6">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : null}
        <CardGridSkeleton count={cardCount} />
      </div>
    </>
  );

  return contained ? (
    <div className="bg-background text-foreground">{content}</div>
  ) : (
    <main className="flex-1 bg-background text-foreground">{content}</main>
  );
}

export function ListPageSkeleton({
  label = "Loading content",
  rows = 5,
}: Readonly<{
  label?: string;
  rows?: number;
}>) {
  return (
    <div className="space-y-8">
      <LoadingAnnouncement label={label} />
      <PageHeaderSkeleton />
      <div className="grid gap-4 rounded-lg border border-muted-background bg-surface p-4 sm:grid-cols-2 sm:p-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
      <ListSkeleton rows={rows} />
    </div>
  );
}

export function DeckPageSkeleton({
  contained = false,
  label = "Loading deck",
}: Readonly<{ contained?: boolean; label?: string }>) {
  const content = (
    <>
      <LoadingAnnouncement label={label} />
      <div className="w-full space-y-8">
        <PageHeaderSkeleton backLink />
        <section className="space-y-5 rounded-lg border border-muted-background bg-surface p-4 sm:p-6">
          <Skeleton className="h-10 w-full max-w-sm" />
          <Skeleton className="h-5 w-48" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton className="h-36 w-full" key={index} />
            ))}
          </div>
        </section>
      </div>
    </>
  );

  return contained ? (
    <div className="bg-background text-foreground">{content}</div>
  ) : (
    <main className="flex-1 bg-background text-foreground">{content}</main>
  );
}

export function ReviewPageSkeleton() {
  return (
    <main className="min-w-0 bg-background text-foreground">
      <LoadingAnnouncement label="Loading review queue" />
      <div className="space-y-8">
        <PageHeaderSkeleton />
        {[0, 1].map((section) => (
          <section className="space-y-4" key={section}>
            <Skeleton className="h-9 w-72 max-w-full" />
            <div className="grid gap-4 xl:grid-cols-2">
              {[0, 1].map((card) => (
                <Skeleton className="h-72 w-full" key={card} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}

export function FormPageSkeleton({ label = "Loading settings" }: Readonly<{ label?: string }>) {
  return (
    <div className="space-y-8">
      <LoadingAnnouncement label={label} />
      <Skeleton className="h-11 w-full max-w-sm" />
      <section className="space-y-6 rounded-lg border border-muted-background bg-surface p-6">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-11 w-44" />
      </section>
    </div>
  );
}

export function NavbarSkeleton() {
  return (
    <header className="border-b border-muted-background bg-surface">
      <LoadingAnnouncement label="Loading navigation" />
      <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-3 px-6 py-3 sm:py-0">
        <Skeleton className="h-10 w-32" />
        <div className="flex items-center gap-2">
          <Skeleton className="hidden h-10 w-20 sm:block" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
    </header>
  );
}

export function SidebarSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-6">
      {[0, 1, 2].map((section) => (
        <div className="space-y-3 border-b border-muted-background pb-5" key={section}>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
      ))}
    </div>
  );
}
