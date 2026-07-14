import {
  normalizeLanguagePreferences,
} from "@/lib/preferences/language";
import { getViewer, getViewerIdentity } from "@/lib/auth/viewer";
import { createClient } from "@/lib/supabase/server";
import {
  SubmissionsBrowser,
  type ContributionSubmission,
} from "./submissions-browser";
import { PageHeader } from "@/components/page-header";

export default async function MyContributionsPage() {
  const viewerPromise = getViewer();
  const { userId } = await getViewerIdentity();
  const supabase = await createClient();
  const submissionsPromise = supabase
    .from("term_submissions")
    .select("id,submitted_by_user_id,simplified,traditional,pinyin,zhuyin,english_definition,parts_of_speech,notes,status,reviewer_notes,created_at")
    .eq("submitted_by_user_id", userId!)
    .order("created_at", { ascending: false })
    .limit(500);
  const [{ profile }, { data: submissions }] = await Promise.all([
    viewerPromise,
    submissionsPromise,
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        description="Follow the words you have suggested through review."
        eyebrow="My stuff"
        title="My contributions"
      />

      <SubmissionsBrowser
        preferences={normalizeLanguagePreferences(profile)}
        submissions={(submissions ?? []) as ContributionSubmission[]}
      />
    </div>
  );
}
