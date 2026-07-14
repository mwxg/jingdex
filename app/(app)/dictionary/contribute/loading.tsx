import {
  LoadingAnnouncement,
  PageHeaderSkeleton,
  Skeleton,
} from "@/components/loading";

export default function LoadingContributeWord() {
  return (
    <div className="space-y-8">
      <LoadingAnnouncement label="Loading contribution form" />
      <PageHeaderSkeleton />
      <section className="rounded-lg border border-muted-background bg-surface p-5 sm:p-6">
        <div className="mb-5 space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-5 w-full max-w-2xl" />
        </div>
        <div className="space-y-5">
          <div className="grid gap-4 lg:grid-cols-2">
            {Array.from({ length: 5 }, (_, index) => (
              <div className="space-y-2" key={index}>
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-12 w-full" />
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-28 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-24 w-full" />
          </div>
          <Skeleton className="h-12 w-44" />
        </div>
      </section>
    </div>
  );
}
