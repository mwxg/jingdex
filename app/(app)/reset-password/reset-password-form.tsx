"use client";

import { useActionState } from "react";
import type { AuthFormState } from "@/lib/auth/validation";
import { updatePassword } from "./actions";

function Message({ state }: Readonly<{ state: AuthFormState }>) {
  if (state.message) {
    return (
      <p className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 font-sans text-sm font-bold text-danger">
        {state.message}
      </p>
    );
  }

  return null;
}

function Field({
  label,
  name,
}: Readonly<{
  label: string;
  name: string;
}>) {
  return (
    <label className="block space-y-2">
      <span className="block font-sans text-sm font-bold text-foreground">
        {label}
      </span>
      <input
        autoComplete="new-password"
        className="h-12 w-full rounded-lg border border-muted-background bg-surface px-4 font-sans text-base text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary"
        minLength={6}
        name={name}
        required
        type="password"
      />
    </label>
  );
}

export function ResetPasswordForm() {
  const [state, action] = useActionState(updatePassword, {});

  return (
    <form action={action} className="space-y-6">
      <Message state={state} />
      <Field label="New password" name="password" />
      <Field label="Confirm new password" name="confirmPassword" />
      <button
        type="submit"
        className="h-11 w-full rounded-lg bg-primary px-5 font-sans text-sm font-bold text-on-primary transition-colors hover:bg-primary/90"
      >
        Update password
      </button>
    </form>
  );
}
