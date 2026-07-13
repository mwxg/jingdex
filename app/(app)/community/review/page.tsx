import { notFound } from "next/navigation";
import { hasPermission } from "@/lib/auth/roles";
import { getChineseDisplayForms, normalizeLanguagePreferences } from "@/lib/preferences/language";
import { createClient } from "@/lib/supabase/server";
import { getPartOfSpeechLabel, type PartOfSpeech } from "@/lib/terms/parts-of-speech";
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

export default async function ReviewPage() {
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

  if (!hasPermission(profile?.role, "reviewTermSubmissions")) notFound();

  const preferences = normalizeLanguagePreferences(profile);
  const { data: pendingRows } = await supabase
    .from("term_submissions")
    .select("id,submitted_by_user_id,simplified,traditional,pinyin,zhuyin,english_definition,parts_of_speech,notes,status,reviewer_notes,created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(100);
  const pending = (pendingRows ?? []) as Submission[];
  const submitterIds = [...new Set(pending.map((row) => row.submitted_by_user_id))];
  const { data: submitters } = submitterIds.length
    ? await supabase.from("profiles").select("id,username").in("id", submitterIds)
    : { data: [] };
  const usernames = new Map((submitters ?? []).map((row) => [row.id, row.username]));

  return (
    <main className="min-w-0 bg-background text-foreground">
      <div className="space-y-8">
        <header className="space-y-3">
          <p className="font-sans text-sm font-bold uppercase text-admin">Admin</p>
          <h1 className="font-heading text-5xl font-semibold leading-none sm:text-6xl">Review</h1>
          <p className="max-w-3xl font-heading text-2xl font-semibold text-muted sm:text-3xl">
            Review pending word submissions from the Jingdex community.
          </p>
        </header>

        <section aria-labelledby="pending-submissions-title" className="space-y-4">
          <h2 className="font-heading text-3xl font-semibold" id="pending-submissions-title">Pending term submissions</h2>
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
      </div>
    </main>
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
