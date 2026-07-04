"use server";

import { revalidatePath } from "next/cache";
import {
  isCharacterSetPreference,
  isPronunciationPreference,
  type CharacterSetPreference,
  type PronunciationPreference,
} from "@/lib/preferences/language";
import { createClient } from "@/lib/supabase/server";

export type LanguageSettingsState = {
  characterSet?: CharacterSetPreference;
  message?: string;
  pronunciation?: PronunciationPreference;
  success?: string;
};

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

export async function updateLanguageSettings(
  _state: LanguageSettingsState,
  formData: FormData,
): Promise<LanguageSettingsState> {
  const characterSet = getRequiredString(formData, "characterSet");
  const pronunciation = getRequiredString(formData, "pronunciation");

  if (!isCharacterSetPreference(characterSet)) {
    return { message: "Choose simplified or traditional." };
  }

  if (!isPronunciationPreference(pronunciation)) {
    return { message: "Choose pinyin or zhuyin." };
  }

  const supabase = await createClient();
  const { data, error: userError } = await supabase.auth.getUser();
  const user = data.user;

  if (userError || !user?.id) {
    return { message: "Sign in again before changing language settings." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      preferred_character_set: characterSet,
      preferred_pronunciation: pronunciation,
    })
    .eq("id", user.id);

  if (error) {
    if (
      error.message.includes("schema cache") ||
      error.message.includes("preferred_character_set") ||
      error.message.includes("preferred_pronunciation")
    ) {
      return {
        characterSet,
        message:
          "Language settings are not installed in Supabase yet. Run the latest language preferences SQL, then refresh this page.",
        pronunciation,
      };
    }

    return {
      characterSet,
      message: getErrorMessage(error, "Could not update language settings."),
      pronunciation,
    };
  }

  revalidatePath("/", "layout");
  return {
    characterSet,
    pronunciation,
    success: "Language settings saved.",
  };
}
