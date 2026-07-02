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
    return { message: error.message };
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
  const usernameError = validateUsername(username);

  if (usernameError) {
    return { message: usernameError };
  }

  if (!email || !password) {
    return { message: "Enter your email and password." };
  }

  const supabase = await createClient();
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
    return { message: error.message };
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
    return { message: "Sign in again before setting your username." };
  }

  const { error } = await supabase.from("profiles").upsert({
    id: userId,
    username,
    role: "member",
  });

  if (error) {
    return { message: error.message };
  }

  revalidatePath("/", "layout");
  redirect(getSafeNextPath(formData.get("next")));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
