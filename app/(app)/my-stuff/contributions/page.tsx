import {
  normalizeLanguagePreferences,
} from "@/lib/preferences/language";
import { createClient } from "@/lib/supabase/server";
import {
  SubmissionsBrowser,
  type ContributionSubmission,
} from "./submissions-browser";

export default async function MyContributionsPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  const userId = authData?.claims?.sub;

  const [{ data: profile }, { data: submissions }] = await Promise.all([
    supabase
      .from("profiles")
      .select("preferred_character_set,preferred_pronunciation")
      .eq("id", userId!)
      .maybeSingle(),
    supabase
      .from("term_submissions")
      .select("id,submitted_by_user_id,simplified,traditional,pinyin,zhuyin,english_definition,parts_of_speech,notes,status,reviewer_notes,created_at")
      .eq("submitted_by_user_id", userId!)
      .order("created_at", { ascending: false })
      .limit(500),
  ]);

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="font-sans text-sm font-bold uppercase text-primary">My stuff</p>
        <h1 className="font-heading text-5xl font-semibold leading-none sm:text-6xl">My Contributions</h1>
        <p className="max-w-3xl font-heading text-2xl font-semibold text-muted sm:text-3xl">
          Follow the words you have suggested through review.
        </p>
      </header>

      <SubmissionsBrowser
        preferences={normalizeLanguagePreferences(profile)}
        submissions={(submissions ?? []) as ContributionSubmission[]}
      />
    </div>
  );
}
