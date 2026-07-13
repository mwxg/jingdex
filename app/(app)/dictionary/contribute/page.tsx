import Link from "next/link";
import { hasPermission } from "@/lib/auth/roles";
import {
  getChineseDisplayForms,
  normalizeLanguagePreferences,
} from "@/lib/preferences/language";
import { createClient } from "@/lib/supabase/server";
import { getPartOfSpeechLabel, type PartOfSpeech } from "@/lib/terms/parts-of-speech";
import { ContributionForm } from "./contribution-form";
import { ReviewForm } from "./review-form";

type Submission = {
  id: string;
  submitted_by_user_id: string;
  simplified: string;
  traditional: string | null;
  pinyin: string;
  zhuyin: string;
  english_definition: string;
  parts_of_speech: PartOfSpeech[] | null;
  notes: string | null;
  status: "pending" | "accepted" | "rejected" | "withdrawn";
  reviewer_notes: string | null;
  created_at: string;
};

export default async function ContributePage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  const userId = authData?.claims?.sub ?? null;
  const { data: profile } = userId
    ? await supabase
        .from("profiles")
        .select("role,preferred_character_set,preferred_pronunciation")
        .eq("id", userId)
        .maybeSingle()
    : { data: null };
  const preferences = normalizeLanguagePreferences(profile);
  const canReview = hasPermission(profile?.role, "reviewTermSubmissions");

  const { data: pendingRows } = canReview
    ? await supabase
        .from("term_submissions")
        .select("id,submitted_by_user_id,simplified,traditional,pinyin,zhuyin,english_definition,parts_of_speech,notes,status,reviewer_notes,created_at")
        .eq("status", "pending")
        .order("created_at", { ascending: true })
        .limit(100)
    : { data: [] };

  const pending = (pendingRows ?? []) as Submission[];
  const submitterIds = [...new Set(pending.map((row) => row.submitted_by_user_id))];
  const { data: submitters } = submitterIds.length
    ? await supabase.from("profiles").select("id,username").in("id", submitterIds)
    : { data: [] };
  const usernames = new Map((submitters ?? []).map((row) => [row.id, row.username]));

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
            <p className="font-sans text-sm leading-6 text-muted">Pronunciation forms are generated for you, but can be corrected before submission.</p>
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

      {canReview ? (
        <section className="space-y-4 border-t-2 border-admin/30 pt-8">
          <div>
            <p className="font-sans text-sm font-bold uppercase text-admin">Admin review</p>
            <h2 className="mt-1 font-heading text-3xl font-semibold">Pending term submissions</h2>
          </div>
          {pending.length ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {pending.map((submission) => (
                <article className="rounded-lg border border-muted-background bg-surface p-5" key={submission.id}>
                  <TermSummary preferences={preferences} submission={submission} />
                  <p className="mt-3 font-sans text-xs font-bold text-muted">
                    Submitted by {usernames.get(submission.submitted_by_user_id) ?? "Unknown user"} · {new Date(submission.created_at).toLocaleDateString("en-US")}
                  </p>
                  <ReviewForm submissionId={submission.id} />
                </article>
              ))}
            </div>
          ) : (
            <p className="rounded-lg border border-muted-background bg-surface p-5 font-sans text-muted">There are no submissions awaiting review.</p>
          )}
        </section>
      ) : null}
    </div>
  );
}

function TermSummary({ preferences, submission }: Readonly<{
  preferences: ReturnType<typeof normalizeLanguagePreferences>;
  submission: Submission;
}>) {
  const forms = getChineseDisplayForms(submission, preferences.characterSet);
  const primaryPronunciation = preferences.pronunciation === "zhuyin" ? submission.zhuyin : submission.pinyin;
  const secondaryPronunciation = preferences.pronunciation === "zhuyin" ? submission.pinyin : submission.zhuyin;
  return (
    <div className="min-w-0">
      <h3 className="font-chinese text-3xl font-bold">{forms.primary}</h3>
      {forms.secondary ? <p className="font-chinese text-lg text-muted">{forms.secondary}</p> : null}
      <p className="mt-2 font-sans font-bold">{primaryPronunciation}</p>
      <p className="font-sans text-sm text-muted">{secondaryPronunciation}</p>
      {submission.parts_of_speech?.length ? <p className="mt-2 font-sans text-xs font-bold uppercase text-primary">{submission.parts_of_speech.map(getPartOfSpeechLabel).join(", ")}</p> : null}
      <p className="mt-2 whitespace-pre-line font-sans leading-6">{submission.english_definition}</p>
      {submission.notes ? <p className="mt-2 font-sans text-sm text-muted">Notes: {submission.notes}</p> : null}
    </div>
  );
}
