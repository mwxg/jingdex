"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  type AuthFormState,
  getSafeNextPath,
  validateUsername,
} from "@/lib/auth/validation";

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
    if (error.code === "user_already_exists") {
      return "An account with that email already exists.";
    }

    if (error.code === "email_exists") {
      return "An account with that email already exists.";
    }
  }

  return fallback;
}

export async function signIn(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = getRequiredString(formData, "email").toLowerCase();
  const password = getRequiredString(formData, "password");

  if (!email || !password) {
    return { message: "Enter your email and password." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      message: getErrorMessage(error, "Could not sign in with those details."),
    };
  }

  revalidatePath("/", "layout");
  redirect(getSafeNextPath(formData.get("next")));
}

export async function signUp(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const username = getRequiredString(formData, "username");
  const email = getRequiredString(formData, "email").toLowerCase();
  const password = getRequiredString(formData, "password");
  const confirmPassword = getRequiredString(formData, "confirmPassword");
  const usernameError = validateUsername(username);

  if (usernameError) {
    return { message: usernameError };
  }

  if (password !== confirmPassword) {
    return { message: "Passwords do not match." };
  }

  if (!email || !password) {
    return { message: "Enter your email and password." };
  }

  const supabase = await createClient();
  const { data: existingProfile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .ilike("username", username)
    .maybeSingle();

  if (profileError) {
    return {
      message: getErrorMessage(
        profileError,
        "Could not check whether that username is available.",
      ),
    };
  }

  if (existingProfile) {
    return { message: "Username is already taken." };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
      },
    },
  });

  if (error) {
    return {
      message: getErrorMessage(
        error,
        "Could not create that account. Check the email, password, and username, then try again.",
      ),
    };
  }

  if (!data.session) {
    return {
      success:
        "Check your email to confirm your account, then return here to sign in.",
    };
  }

  revalidatePath("/", "layout");
  redirect(getSafeNextPath(formData.get("next")));
}

export async function completeProfile(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const username = getRequiredString(formData, "username");
  const usernameError = validateUsername(username);

  if (usernameError) {
    return { message: usernameError };
  }

  const supabase = await createClient();
  const { data, error: authError } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (authError || !userId) {
    return {
      message: getErrorMessage(
        authError,
        "Sign in again before setting your username.",
      ),
    };
  }

  const { error } = await supabase.from("profiles").upsert({
    id: userId,
    username,
    role: "member",
  });

  if (error) {
    return {
      message: getErrorMessage(error, "Could not save that username."),
    };
  }

  revalidatePath("/", "layout");
  redirect(getSafeNextPath(formData.get("next")));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
