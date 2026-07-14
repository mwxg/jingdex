"use client";

import { useActionState, useState } from "react";
import type { AuthFormState } from "@/lib/auth/validation";
import { completeProfile, signIn, signUp } from "./actions";

function SubmitButton({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <button
      type="submit"
      className="h-11 w-full rounded-lg bg-primary px-5 font-sans text-sm font-bold text-on-primary transition-colors hover:bg-primary/90"
    >
      {children}
    </button>
  );
}

function ModeButton({
  active,
  children,
  onClick,
}: Readonly<{
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}>) {
  return (
    <button
      type="button"
      className={`h-10 flex-1 rounded-lg font-sans text-sm font-bold transition-colors ${
        active
          ? "bg-primary text-on-primary"
          : "text-muted hover:bg-muted-background hover:text-foreground"
      }`}
      onClick={onClick}
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
    <label className="block space-y-2">
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
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");

  if (isLoggedIn && !hasProfile) {
    return (
      <form action={profileAction} className="space-y-6">
        <input name="next" type="hidden" value={nextPath} />
        <Message state={profileState} />
        <Field autoComplete="username" label="Username" name="username" />
        <SubmitButton>Save username</SubmitButton>
      </form>
    );
  }

  const isSignIn = mode === "sign-in";

  return (
    <form action={isSignIn ? signInAction : signUpAction} className="space-y-6">
      <input name="next" type="hidden" value={nextPath} />
      <div
        aria-label="Authentication mode"
        className="flex rounded-lg bg-muted-background p-1"
        role="group"
      >
        <ModeButton active={isSignIn} onClick={() => setMode("sign-in")}>
          Sign in
        </ModeButton>
        <ModeButton active={!isSignIn} onClick={() => setMode("sign-up")}>
          Sign up
        </ModeButton>
      </div>

      <Message state={isSignIn ? signInState : signUpState} />

      {!isSignIn ? (
        <Field autoComplete="username" label="Username" name="username" />
      ) : null}

      <Field autoComplete="email" label="Email" name="email" type="email" />
      <Field
        autoComplete={isSignIn ? "current-password" : "new-password"}
        label="Password"
        name="password"
        type="password"
      />

      {!isSignIn ? (
        <Field
          autoComplete="new-password"
          label="Confirm password"
          name="confirmPassword"
          type="password"
        />
      ) : null}

      <SubmitButton>{isSignIn ? "Sign in" : "Create account"}</SubmitButton>
    </form>
  );
}
