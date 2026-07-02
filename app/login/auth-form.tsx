"use client";

import { useActionState } from "react";
import type { AuthFormState } from "@/lib/auth/validation";
import { completeProfile, signIn, signUp } from "./actions";

function SubmitButton({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <button
      type="submit"
      className="h-11 rounded-lg bg-primary px-5 font-sans text-sm font-bold text-text-light transition-colors hover:bg-primary/90"
    >
      {children}
    </button>
  );
}

function Message({ state }: Readonly<{ state: AuthFormState }>) {
  if (state.success) {
    return (
      <p className="rounded-lg border border-confirm/30 bg-confirm/10 px-4 py-3 font-sans text-sm font-bold text-confirm">
        {state.success}
      </p>
    );
  }

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
  autoComplete,
  label,
  name,
  type = "text",
}: Readonly<{
  autoComplete: string;
  label: string;
  name: string;
  type?: string;
}>) {
  return (
    <label className="space-y-2">
      <span className="block font-sans text-sm font-bold text-foreground">
        {label}
      </span>
      <input
        autoComplete={autoComplete}
        className="h-12 w-full rounded-lg border border-muted-background bg-surface px-4 font-sans text-base text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary"
        name={name}
        required
        type={type}
      />
    </label>
  );
}

export function AuthForm({
  hasProfile,
  isLoggedIn,
  nextPath,
}: Readonly<{
  hasProfile: boolean;
  isLoggedIn: boolean;
  nextPath: string;
}>) {
  const [signInState, signInAction] = useActionState(signIn, {});
  const [signUpState, signUpAction] = useActionState(signUp, {});
  const [profileState, profileAction] = useActionState(completeProfile, {});

  if (isLoggedIn && !hasProfile) {
    return (
      <form action={profileAction} className="space-y-5">
        <input name="next" type="hidden" value={nextPath} />
        <Message state={profileState} />
        <Field autoComplete="username" label="Username" name="username" />
        <SubmitButton>Save username</SubmitButton>
      </form>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <form action={signInAction} className="space-y-5">
        <input name="next" type="hidden" value={nextPath} />
        <div>
          <h2 className="font-heading text-3xl font-semibold text-foreground">
            Sign in
          </h2>
          <p className="mt-2 font-sans text-base leading-7 text-muted">
            Return to your decks and study queue.
          </p>
        </div>
        <Message state={signInState} />
        <Field autoComplete="email" label="Email" name="email" type="email" />
        <Field
          autoComplete="current-password"
          label="Password"
          name="password"
          type="password"
        />
        <SubmitButton>Sign in</SubmitButton>
      </form>

      <form action={signUpAction} className="space-y-5">
        <input name="next" type="hidden" value={nextPath} />
        <div>
          <h2 className="font-heading text-3xl font-semibold text-foreground">
            Create account
          </h2>
          <p className="mt-2 font-sans text-base leading-7 text-muted">
            Pick a username before making decks.
          </p>
        </div>
        <Message state={signUpState} />
        <Field autoComplete="username" label="Username" name="username" />
        <Field autoComplete="email" label="Email" name="email" type="email" />
        <Field
          autoComplete="new-password"
          label="Password"
          name="password"
          type="password"
        />
        <SubmitButton>Create account</SubmitButton>
      </form>
    </div>
  );
}
