import Link from "next/link";
import { getViewerIdentity } from "@/lib/auth/viewer";
import { ContributionForm } from "./contribution-form";
import { PageHeader } from "@/components/page-header";

export default async function ContributePage() {
  const { userId } = await getViewerIdentity();

  return (
    <div className="space-y-8">
      <PageHeader
        description="Help Jingdex grow by suggesting a term for review."
        eyebrow="Dictionary"
        title="Contribute words"
      />

      {userId ? (
        <section className="rounded-lg border border-muted-background bg-surface p-5 sm:p-6">
          <div className="mb-5 space-y-1">
            <h2 className="font-heading text-2xl font-semibold">Suggest a word</h2>
            <p className="font-sans text-sm leading-6 text-muted">Pinyin, zhuyin, and traditional forms are automatically generated from the simplified form. Can be manually edited after if needed.</p>
          </div>
          <ContributionForm />
        </section>
      ) : (
        <section className="rounded-lg border border-muted-background bg-surface p-6">
          <h2 className="font-heading text-2xl font-semibold">Sign in to contribute</h2>
          <p className="mt-2 font-sans text-muted">An account is required so you can follow your submission through review.</p>
          <Link className="mt-4 inline-flex h-11 items-center rounded-lg bg-primary px-5 font-sans text-sm font-bold text-on-primary" href="/login?next=/dictionary/contribute">Sign in</Link>
        </section>
      )}
    </div>
  );
}
