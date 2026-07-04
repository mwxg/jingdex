"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { AuthFormState } from "@/lib/auth/validation";
import { createClient } from "@/lib/supabase/server";

function getRequiredString(formData: FormData, name: string) {
  const value = formData.get(name);

  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function getErrorMessage(error: unknown, fallback: string) {
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string" &&
    error.message.trim() &&
    error.message.trim() !== "{}"
  ) {
    return error.message;
  }

  return fallback;
}

export async function updatePassword(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const password = getRequiredString(formData, "password");
  const confirmPassword = getRequiredString(formData, "confirmPassword");

  if (!password || !confirmPassword) {
    return { message: "Enter and confirm your new password." };
  }

  if (password !== confirmPassword) {
    return { message: "Passwords do not match." };
  }

  const supabase = await createClient();
  const { data, error: userError } = await supabase.auth.getUser();

  if (userError || !data.user) {
    return { message: "Open the password reset link again before continuing." };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return {
      message: getErrorMessage(error, "Could not update your password."),
    };
  }

  revalidatePath("/", "layout");
  redirect("/settings/account");
}
