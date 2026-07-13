"use client";

import { useMemo, useState } from "react";
import {
  getChineseDisplayForms,
  type LanguagePreferences,
} from "@/lib/preferences/language";
import { getPartOfSpeechLabel, type PartOfSpeech } from "@/lib/terms/parts-of-speech";

export type ContributionSubmission = {
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

const PAGE_SIZE = 4;
const statusStyles = {
  pending: "bg-primary/10 text-primary",
  accepted: "bg-confirm/10 text-confirm",
  rejected: "bg-danger/10 text-danger",
  withdrawn: "bg-muted-background text-muted",
} as const;

export function SubmissionsBrowser({ preferences, submissions }: Readonly<{
  preferences: LanguagePreferences;
  submissions: ContributionSubmission[];
}>) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return submissions.filter((submission) => {
      if (status !== "all" && submission.status !== status) return false;
      if (!normalizedQuery) return true;
      return [submission.simplified, submission.traditional, submission.pinyin,
        submission.zhuyin, submission.english_definition, submission.notes,
        submission.reviewer_notes].some((field) =>
        field?.toLocaleLowerCase().includes(normalizedQuery),
      );
    });
  }, [query, status, submissions]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <section className="space-y-4">
      <h2 className="font-heading text-3xl font-semibold">Your submissions</h2>
      <div className="grid gap-3 rounded-lg border border-muted-background bg-surface p-4 sm:grid-cols-[minmax(0,1fr)_12rem] sm:items-end">
        <label className="space-y-2">
          <span className="block font-sans text-sm font-bold">Search your submissions</span>
          <input
            className="h-11 w-full rounded-lg border border-muted-background bg-surface px-4 font-sans text-base outline-none placeholder:text-muted focus:border-primary"
            onChange={(event) => { setQuery(event.target.value); setPage(1); }}
            placeholder="Term, pronunciation, or definition"
            type="search"
            value={query}
          />
        </label>
        <label className="space-y-2">
          <span className="block font-sans text-sm font-bold">Status</span>
          <select
            className="h-11 w-full rounded-lg border border-muted-background bg-surface px-3 font-sans text-sm font-bold outline-none focus:border-primary"
            onChange={(event) => { setStatus(event.target.value); setPage(1); }}
            value={status}
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
            <option value="withdrawn">Withdrawn</option>
          </select>
        </label>
      </div>

      <p aria-live="polite" className="font-sans text-sm text-muted">
        {filtered.length} {filtered.length === 1 ? "submission" : "submissions"} found
      </p>

      {visible.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {visible.map((submission) => (
            <article className="rounded-lg border border-muted-background bg-surface p-5" key={submission.id}>
              <div className="flex items-start justify-between gap-3">
                <SubmissionSummary preferences={preferences} submission={submission} />
                <span className={`shrink-0 rounded-full px-3 py-1 font-sans text-xs font-bold capitalize ${statusStyles[submission.status]}`}>{submission.status}</span>
              </div>
              {submission.reviewer_notes ? <p className="mt-4 border-t border-muted-background pt-4 font-sans text-sm text-muted"><strong className="text-foreground">Reviewer note:</strong> {submission.reviewer_notes}</p> : null}
            </article>
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-muted-background bg-surface p-5 font-sans text-muted">
          {query || status !== "all" ? "No submissions match your search." : "You have not submitted any words yet."}
        </p>
      )}

      {pageCount > 1 ? (
        <nav aria-label="Your submissions pages" className="flex items-center justify-between gap-3 font-sans text-sm font-bold">
          <button className="h-10 rounded-lg border border-muted-background bg-surface px-4 disabled:cursor-not-allowed disabled:opacity-50" disabled={safePage === 1} onClick={() => setPage(safePage - 1)} type="button">Previous</button>
          <span className="text-muted">Page {safePage} of {pageCount}</span>
          <button className="h-10 rounded-lg border border-muted-background bg-surface px-4 disabled:cursor-not-allowed disabled:opacity-50" disabled={safePage === pageCount} onClick={() => setPage(safePage + 1)} type="button">Next</button>
        </nav>
      ) : null}
    </section>
  );
}

function SubmissionSummary({ preferences, submission }: Readonly<{
  preferences: LanguagePreferences;
  submission: ContributionSubmission;
}>) {
  const forms = getChineseDisplayForms(submission, preferences.characterSet);
  const pronunciations = preferences.pronunciation === "zhuyin"
    ? [submission.zhuyin, submission.pinyin]
    : [submission.pinyin, submission.zhuyin];
  return (
    <div className="min-w-0">
      <h3 className="font-chinese text-3xl font-bold">{forms.primary}</h3>
      {forms.secondary ? <p className="font-chinese text-lg text-muted">{forms.secondary}</p> : null}
      <p className="mt-2 font-sans font-bold">{pronunciations[0]}</p>
      <p className="font-sans text-sm text-muted">{pronunciations[1]}</p>
      {submission.parts_of_speech?.length ? <p className="mt-2 font-sans text-xs font-bold uppercase text-primary">{submission.parts_of_speech.map(getPartOfSpeechLabel).join(", ")}</p> : null}
      <p className="mt-2 whitespace-pre-line font-sans leading-6">{submission.english_definition}</p>
      {submission.notes ? <p className="mt-2 font-sans text-sm text-muted">Notes: {submission.notes}</p> : null}
    </div>
  );
}
