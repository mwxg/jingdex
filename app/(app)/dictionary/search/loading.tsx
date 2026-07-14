import {
  LoadingAnnouncement,
  PageHeaderSkeleton,
  Skeleton,
} from "@/components/loading";

export default function LoadingDictionarySearch() {
  return (
    <div className="space-y-8">
      <LoadingAnnouncement label="Loading dictionary search" />
      <PageHeaderSkeleton />
      <section className="rounded-lg border border-muted-background bg-surface p-6">
        <div className="grid gap-3 lg:grid-cols-[1fr_16rem] lg:items-end">
          <div className="space-y-2">
            <Skeleton className="h-5 w-72 max-w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-5 w-12" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </section>
    </div>
  );
}
