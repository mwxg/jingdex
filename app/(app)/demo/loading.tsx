import {
  LoadingAnnouncement,
  PageHeaderSkeleton,
  Skeleton,
} from "@/components/loading";

export default function DemoLoading() {
  return (
    <main className="min-w-0 bg-background text-foreground">
      <LoadingAnnouncement label="Loading the interface guide" />
      <div aria-hidden="true" className="w-full space-y-12">
        <PageHeaderSkeleton />
        {[0, 1, 2].map((section) => (
          <section className="space-y-4" key={section}>
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-5 w-full max-w-2xl" />
            <div className="grid gap-4 rounded-lg border border-muted-background bg-surface p-5 sm:grid-cols-2 sm:p-6">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
