"use client";

import { useActionState, useState } from "react";
import { reviewContribution, type ContributionActionState } from "@/app/(app)/dictionary/contribute/actions";
import { ActionMessage } from "@/app/(app)/dictionary/contribute/contribution-form";
import { reviewDeck, type DeckReviewActionState } from "./actions";
import { PendingLabel } from "@/components/loading";

function DecisionButtons({ pending }: Readonly<{ pending: boolean }>) {
  const [decision, setDecision] = useState<"accepted" | "rejected" | null>(null);

  return (
    <div className="flex flex-wrap gap-2">
      <button
        className="inline-flex h-10 items-center justify-center rounded-lg bg-confirm px-4 font-sans text-sm font-bold text-on-confirm disabled:opacity-60"
        disabled={pending}
        formNoValidate
        name="decision"
        onClick={() => setDecision("accepted")}
        type="submit"
        value="accepted"
      >
        {pending && decision === "accepted" ? <PendingLabel>Accepting…</PendingLabel> : "Accept"}
      </button>
      <button
        className="inline-flex h-10 items-center justify-center rounded-lg bg-danger px-4 font-sans text-sm font-bold text-on-danger disabled:opacity-60"
        disabled={pending}
        name="decision"
        onClick={() => setDecision("rejected")}
        type="submit"
        value="rejected"
      >
        {pending && decision === "rejected" ? <PendingLabel>Rejecting…</PendingLabel> : "Reject"}
      </button>
    </div>
  );
}

export function ReviewForm({ submissionId }: Readonly<{ submissionId: string }>) {
  const [state, action, pending] = useActionState<ContributionActionState, FormData>(reviewContribution, {});

  return (
    <form action={action} aria-busy={pending} className="mt-4 space-y-3 border-t border-muted-background pt-4">
      <input name="submissionId" type="hidden" value={submissionId} />
      <ActionMessage state={state} />
      <label className="block space-y-2">
        <span className="font-sans text-sm font-bold">Reviewer notes <span className="font-normal text-muted">(required when rejecting)</span></span>
        <textarea className="min-h-20 w-full resize-y rounded-lg border border-muted-background bg-surface px-3 py-2 font-sans outline-none focus:border-primary" name="reviewerNotes" required />
      </label>
      <DecisionButtons pending={pending} />
    </form>
  );
}

export function DeckReviewForm({ deckId }: Readonly<{ deckId: string }>) {
  const [state, action, pending] = useActionState<DeckReviewActionState, FormData>(reviewDeck, {});

  return (
    <form action={action} aria-busy={pending} className="mt-4 space-y-3 border-t border-muted-background pt-4">
      <input name="deckId" type="hidden" value={deckId} />
      <ActionMessage state={state} />
      <label className="block space-y-2">
        <span className="font-sans text-sm font-bold">Reviewer notes <span className="font-normal text-muted">(required when rejecting)</span></span>
        <textarea className="min-h-20 w-full resize-y rounded-lg border border-muted-background bg-surface px-3 py-2 font-sans outline-none focus:border-primary" name="reviewerNotes" required />
      </label>
      <DecisionButtons pending={pending} />
    </form>
  );
}
