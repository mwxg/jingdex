import {
  CardGridSkeleton,
  ListSkeleton,
  LoadingAnnouncement,
  Skeleton,
} from "@/components/loading";

export default function UserProfileLoading() {
  return (
    <main className="flex-1 bg-background px-4 py-8 text-foreground sm:px-6 sm:py-12">
      <LoadingAnnouncement label="Loading profile" />
      <div className="mx-auto w-full max-w-6xl space-y-10">
        <section className="grid gap-6 rounded-lg border border-muted-background bg-surface p-5 sm:p-7 md:grid-cols-[10rem_minmax(0,1fr)]">
          <Skeleton className="size-32 sm:size-40" />
          <div className="space-y-4">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-12 w-64 max-w-full" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-28 w-full" />
          </div>
        </section>
        <section className="space-y-4">
          <Skeleton className="h-9 w-48" />
          <CardGridSkeleton count={3} />
        </section>
        <section className="space-y-4">
          <Skeleton className="h-9 w-56" />
          <ListSkeleton rows={4} />
        </section>
      </div>
    </main>
  );
}
