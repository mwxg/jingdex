"use client";

import { useActionState } from "react";
import { reviewContribution, type ContributionActionState } from "@/app/(app)/dictionary/contribute/actions";
import { ActionMessage } from "@/app/(app)/dictionary/contribute/contribution-form";
import { reviewDeck, type DeckReviewActionState } from "./actions";

export function ReviewForm({ submissionId }: Readonly<{ submissionId: string }>) {
  const [state, action, pending] = useActionState<ContributionActionState, FormData>(reviewContribution, {});

  return (
    <form action={action} className="mt-4 space-y-3 border-t border-muted-background pt-4">
      <input name="submissionId" type="hidden" value={submissionId} />
      <ActionMessage state={state} />
      <label className="block space-y-2">
        <span className="font-sans text-sm font-bold">Reviewer notes <span className="font-normal text-muted">(optional)</span></span>
        <textarea className="min-h-20 w-full resize-y rounded-lg border border-muted-background bg-surface px-3 py-2 font-sans outline-none focus:border-primary" name="reviewerNotes" />
      </label>
      <div className="flex flex-wrap gap-2">
        <button className="h-10 rounded-lg bg-confirm px-4 font-sans text-sm font-bold text-text-light disabled:opacity-60" disabled={pending} name="decision" type="submit" value="accepted">Accept</button>
        <button className="h-10 rounded-lg bg-danger px-4 font-sans text-sm font-bold text-text-light disabled:opacity-60" disabled={pending} name="decision" type="submit" value="rejected">Reject</button>
      </div>
    </form>
  );
}

export function DeckReviewForm({ deckId }: Readonly<{ deckId: string }>) {
  const [state, action, pending] = useActionState<DeckReviewActionState, FormData>(reviewDeck, {});

  return (
    <form action={action} className="mt-4 space-y-3 border-t border-muted-background pt-4">
      <input name="deckId" type="hidden" value={deckId} />
      <ActionMessage state={state} />
      <label className="block space-y-2">
        <span className="font-sans text-sm font-bold">Reviewer notes <span className="font-normal text-muted">(optional)</span></span>
        <textarea className="min-h-20 w-full resize-y rounded-lg border border-muted-background bg-surface px-3 py-2 font-sans outline-none focus:border-primary" name="reviewerNotes" />
      </label>
      <div className="flex flex-wrap gap-2">
        <button className="h-10 rounded-lg bg-confirm px-4 font-sans text-sm font-bold text-text-light disabled:opacity-60" disabled={pending} name="decision" type="submit" value="accepted">Accept</button>
        <button className="h-10 rounded-lg bg-danger px-4 font-sans text-sm font-bold text-text-light disabled:opacity-60" disabled={pending} name="decision" type="submit" value="rejected">Reject</button>
      </div>
    </form>
  );
}
