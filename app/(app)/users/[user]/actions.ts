"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type BioFormState = {
  message?: string;
  success?: string;
};

export async function updateBio(
  _state: BioFormState,
  formData: FormData,
): Promise<BioFormState> {
  const rawBio = formData.get("bio");
  const bio = typeof rawBio === "string" ? rawBio.trim() : "";

  if (bio.length > 240) {
    return { message: "Keep your bio to 240 characters or fewer." };
  }

  const supabase = await createClient();
  const { data, error: authError } = await supabase.auth.getClaims();
  const userId = authError ? null : data?.claims?.sub;

  if (!userId) {
    return { message: "Sign in again before editing your bio." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ bio: bio || null })
    .eq("id", userId);

  if (error) {
    return { message: "Could not update your bio." };
  }

  revalidatePath("/users", "layout");
  return { success: "Bio updated." };
}
