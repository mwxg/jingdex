import { DictionarySearch } from "../dictionary-search";
import { normalizeLanguagePreferences } from "@/lib/preferences/language";
import { getViewer } from "@/lib/auth/viewer";
import { PageHeader } from "@/components/page-header";

export default async function DictionarySearchPage() {
  const { profile } = await getViewer();

  return (
    <div className="space-y-8">
      <PageHeader
        description="Explore our expanding, community-driven Chinese dictionary."
        eyebrow="Dictionary"
        title="Search Chinese terms"
      />
      <DictionarySearch preferences={normalizeLanguagePreferences(profile)} />
    </div>
  );
}
