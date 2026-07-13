import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ContributionForm } from "./contribution-form";

export default async function ContributePage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  const userId = authData?.claims?.sub ?? null;

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="font-sans text-sm font-bold uppercase text-primary">Dictionary</p>
        <h1 className="font-heading text-5xl font-semibold leading-none sm:text-6xl">Contribute words</h1>
        <p className="max-w-3xl font-heading text-2xl font-semibold text-muted sm:text-3xl">
          Help Jingdex grow by suggesting a term for review.
        </p>
      </header>

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
          <Link className="mt-4 inline-flex h-11 items-center rounded-lg bg-primary px-5 font-sans text-sm font-bold text-text-light" href="/login?next=/dictionary/contribute">Sign in</Link>
        </section>
      )}
    </div>
  );
}
