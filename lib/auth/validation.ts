export type AuthFormState = {
  message?: string;
  success?: string;
};

const USERNAME_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_]{2,31}$/;

export function validateUsername(username: string) {
  if (!USERNAME_PATTERN.test(username)) {
    return "Username must be 3-32 characters, start with a letter or number, and use only letters, numbers, or _.";
  }

  return null;
}

export function getSafeNextPath(value: FormDataEntryValue | string | null) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  if (value.startsWith("/login")) {
    return "/";
  }

  return value;
}
