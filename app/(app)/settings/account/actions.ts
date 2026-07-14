"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { validateUsername, type AuthFormState } from "@/lib/auth/validation";
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

  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    if (error.code === "23505") {
      return "Username is already taken.";
    }
  }

  return fallback;
}

async function getSiteOrigin() {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const proto = headerStore.get("x-forwarded-proto") ?? "https";

  if (!host) {
    return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  }

  return `${proto}://${host}`;
}

async function getCurrentUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  const user = data.user;

  if (error || !user?.id || !user.email) {
    return { supabase, user: null, error };
  }

  return { supabase, user, error: null };
}

export async function sendPasswordChangeEmail(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const confirmationEmail = getRequiredString(formData, "email").toLowerCase();
  const { supabase, user, error: userError } = await getCurrentUser();

  if (userError || !user?.email) {
    return {
      message: getErrorMessage(
        userError,
        "Sign in again before changing your password.",
      ),
    };
  }

  if (confirmationEmail !== user.email.toLowerCase()) {
    return { message: "Enter the email address for this account." };
  }

  const origin = await getSiteOrigin();
  const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  if (error) {
    return {
      message: getErrorMessage(error, "Could not send a password change email."),
    };
  }

  return {
    success: "Check your email to confirm and finish changing your password.",
  };
}

export async function changeUsername(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const currentUsername = getRequiredString(formData, "currentUsername");
  const newUsername = getRequiredString(formData, "newUsername");
  const password = getRequiredString(formData, "password");
  const usernameError = validateUsername(newUsername);

  if (usernameError) {
    return { message: usernameError };
  }

  if (!currentUsername || !password) {
    return { message: "Enter your current username and password." };
  }

  const { supabase, user, error: userError } = await getCurrentUser();

  if (userError || !user?.id || !user.email) {
    return {
      message: getErrorMessage(
        userError,
        "Sign in again before changing your username.",
      ),
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return {
      message: getErrorMessage(profileError, "Could not load your profile."),
    };
  }

  if (profile.username !== currentUsername) {
    return { message: "Current username does not match this account." };
  }

  const { error: passwordError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password,
  });

  if (passwordError) {
    return {
      message: getErrorMessage(passwordError, "Password could not be verified."),
    };
  }

  const { data: existingProfile, error: existingError } = await supabase
    .from("profiles")
    .select("id")
    .ilike("username", newUsername)
    .neq("id", user.id)
    .maybeSingle();

  if (existingError) {
    return {
      message: getErrorMessage(
        existingError,
        "Could not check whether that username is available.",
      ),
    };
  }

  if (existingProfile) {
    return { message: "Username is already taken." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ username: newUsername })
    .eq("id", user.id);

  if (error) {
    return {
      message: getErrorMessage(error, "Could not change your username."),
    };
  }

  revalidatePath("/", "layout");
  revalidatePath("/settings/account");
  return { success: "Username changed." };
}

export async function updateProfileVisibility(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const isPublic = formData.get("isPublic") === "true";
  const { supabase, user, error: userError } = await getCurrentUser();

  if (userError || !user?.id) {
    return {
      message: getErrorMessage(
        userError,
        "Sign in again before changing profile visibility.",
      ),
    };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ is_public: isPublic })
    .eq("id", user.id);

  if (error) {
    return {
      message: getErrorMessage(error, "Could not change profile visibility."),
    };
  }

  revalidatePath("/", "layout");
  revalidatePath("/settings/account");
  revalidatePath("/users", "layout");
  return {
    success: `Profile changed to ${isPublic ? "public" : "private"}.`,
  };
}

export async function deleteOwnAccount(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const confirmation = getRequiredString(formData, "confirmation");
  const password = getRequiredString(formData, "password");

  if (confirmation !== "DELETE") {
    return { message: "Type DELETE exactly to confirm account deletion." };
  }

  if (!password) {
    return { message: "Enter your password to delete your account." };
  }

  const { supabase, user, error: userError } = await getCurrentUser();

  if (userError || !user?.id || !user.email) {
    return {
      message: getErrorMessage(
        userError,
        "Sign in again before deleting your account.",
      ),
    };
  }

  const { error: passwordError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password,
  });

  if (passwordError) {
    return {
      message: getErrorMessage(passwordError, "Password could not be verified."),
    };
  }

  const { error } = await supabase.rpc("delete_own_account");

  if (error) {
    return {
      message: getErrorMessage(error, "Could not delete your account."),
    };
  }

  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function signOutFromSettings() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
