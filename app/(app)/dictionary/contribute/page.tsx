import { LoginRequired } from "@/components/login-required";
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
        <LoginRequired
          description="An account is required so you can follow your submission through review."
          nextPath="/dictionary/contribute"
          title="Log in to contribute words"
        />
      )}
    </div>
  );
}
