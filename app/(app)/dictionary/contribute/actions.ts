"use server";

import { revalidatePath } from "next/cache";
import { hasPermission } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { getCanonicalSimplified } from "@/lib/terms/generated-forms";
import { normalizePartsOfSpeech } from "@/lib/terms/parts-of-speech";
import {
  TERM_DEFINITION_MAX_LENGTH,
  TERM_NOTES_MAX_LENGTH,
} from "@/lib/terms/content-limits";

export type ContributionActionState = { message?: string; success?: string };

function value(formData: FormData, name: string) {
  const raw = formData.get(name);
  return typeof raw === "string" ? raw.trim().normalize("NFC") : "";
}

function errorMessage(error: unknown, fallback: string) {
  return error && typeof error === "object" && "message" in error
    && typeof error.message === "string" && error.message.trim()
    ? error.message
    : fallback;
}

export async function submitContribution(
  _state: ContributionActionState,
  formData: FormData,
): Promise<ContributionActionState> {
  const simplified = getCanonicalSimplified(value(formData, "simplified"));
  const traditional = value(formData, "traditional");
  const pinyin = value(formData, "pinyin");
  const zhuyin = value(formData, "zhuyin");
  const definition = value(formData, "definition");
  const notes = value(formData, "notes");
  const partsOfSpeech = normalizePartsOfSpeech(formData.getAll("partsOfSpeech"));

  if (!simplified || !pinyin || !zhuyin || !definition) {
    return { message: "Add simplified, pinyin, zhuyin, and a definition." };
  }

  if (definition.length > TERM_DEFINITION_MAX_LENGTH) {
    return { message: `Keep the definition to ${TERM_DEFINITION_MAX_LENGTH.toLocaleString()} characters or fewer.` };
  }

  if (notes.length > TERM_NOTES_MAX_LENGTH) {
    return { message: `Keep contributor notes to ${TERM_NOTES_MAX_LENGTH.toLocaleString()} characters or fewer.` };
  }

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  if (!authData?.claims?.sub) return { message: "Sign in to contribute a word." };

  const { error } = await supabase.rpc("submit_term_contribution", {
    term_row: {
      canonical_simplified: simplified,
      traditional: traditional || null,
      pinyin,
      zhuyin,
      english_definition: definition,
      parts_of_speech: partsOfSpeech,
      notes: notes || null,
    },
  });

  if (error) return { message: errorMessage(error, "Could not submit that word.") };
  revalidatePath("/dictionary/contribute");
  return { success: `${simplified} was submitted for review.` };
}

export async function reviewContribution(
  _state: ContributionActionState,
  formData: FormData,
): Promise<ContributionActionState> {
  const submissionId = value(formData, "submissionId");
  const decision = value(formData, "decision");
  const reviewerNotes = value(formData, "reviewerNotes");
  if (!submissionId || !["accepted", "rejected"].includes(decision)) {
    return { message: "Choose a valid submission and decision." };
  }
  if (decision === "rejected" && !reviewerNotes) {
    return { message: "Add reviewer notes before rejecting this term." };
  }

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  const userId = authData?.claims?.sub ?? null;
  const { data: profile } = userId
    ? await supabase.from("profiles").select("role").eq("id", userId).maybeSingle()
    : { data: null };
  if (!hasPermission(profile?.role, "reviewTermSubmissions")) {
    return { message: "Only admins and developers can review submissions." };
  }

  const { error } = await supabase.rpc("review_term_contribution", {
    submission_id: submissionId,
    decision,
    review_note: reviewerNotes || null,
  });
  if (error) return { message: errorMessage(error, "Could not review that submission.") };
  revalidatePath("/dictionary/contribute");
  revalidatePath("/dictionary/search");
  revalidatePath("/community/review");
  return { success: `Submission ${decision}.` };
}
