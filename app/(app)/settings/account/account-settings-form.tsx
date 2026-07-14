"use client";

import { useActionState } from "react";
import type { AuthFormState } from "@/lib/auth/validation";
import {
  changeUsername,
  deleteOwnAccount,
  sendPasswordChangeEmail,
  signOutFromSettings,
} from "./actions";

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
  defaultValue,
  label,
  name,
  placeholder,
  type = "text",
}: Readonly<{
  autoComplete: string;
  defaultValue?: string;
  label: string;
  name: string;
  placeholder?: string;
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
        defaultValue={defaultValue}
        name={name}
        placeholder={placeholder}
        required
        type={type}
      />
    </label>
  );
}

function SubmitButton({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <button
      type="submit"
      className="h-11 w-fit rounded-lg bg-primary px-5 font-sans text-sm font-bold text-on-primary transition-colors hover:bg-primary/90"
    >
      {children}
    </button>
  );
}

export function AccountSettingsForm({
  email,
  username,
}: Readonly<{
  email: string;
  username: string;
}>) {
  const [passwordState, passwordAction] = useActionState(
    sendPasswordChangeEmail,
    {},
  );
  const [usernameState, usernameAction] = useActionState(changeUsername, {});
  const [deleteState, deleteAction] = useActionState(deleteOwnAccount, {});

  return (
    <div className="flex min-h-full flex-col gap-8">
      <div className="space-y-2">
        <h1 className="font-heading text-4xl font-semibold text-foreground">
          Account settings
        </h1>
      </div>

      <div className="grid gap-6">
        <section className="rounded-lg border border-muted-background bg-surface p-6">
          <form action={passwordAction} className="space-y-5">
            <div className="space-y-2">
              <h2 className="font-heading text-2xl font-semibold text-foreground">
                Password
              </h2>
              <p className="max-w-2xl font-sans text-sm leading-6 text-muted">
                We will send a confirmation email to this account. Follow the
                link in that email to finish changing your password.
              </p>
            </div>
            <Message state={passwordState} />
            <Field
              autoComplete="email"
              defaultValue={email}
              label="Confirmation email"
              name="email"
              type="email"
            />
            <SubmitButton>Email password change link</SubmitButton>
          </form>
        </section>

        <section className="rounded-lg border border-muted-background bg-surface p-6">
          <form action={usernameAction} className="space-y-5">
            <div className="space-y-2">
              <h2 className="font-heading text-2xl font-semibold text-foreground">
                Username
              </h2>
            </div>
            <Message state={usernameState} />
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                autoComplete="username"
                label="Current username"
                name="currentUsername"
                placeholder={username}
              />
              <Field
                autoComplete="username"
                label="New username"
                name="newUsername"
              />
              <div className="md:col-span-2">
                <Field
                  autoComplete="current-password"
                  label="Password"
                  name="password"
                  type="password"
                />
              </div>
            </div>
            <SubmitButton>Change username</SubmitButton>
          </form>
        </section>

        <section className="rounded-lg border border-danger/40 bg-surface p-6">
          <form action={deleteAction} className="space-y-5">
            <div className="space-y-2">
              <h2 className="font-heading text-2xl font-semibold text-danger">
                Delete account
              </h2>
              <p className="max-w-2xl font-sans text-sm leading-6 text-muted">
                Permanently delete your account and learning data. Community
                contributions may remain, but they will no longer be linked to
                your profile. This action cannot be undone.
              </p>
            </div>
            <Message state={deleteState} />
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                autoComplete="off"
                label="Type DELETE to confirm"
                name="confirmation"
              />
              <Field
                autoComplete="current-password"
                label="Password"
                name="password"
                type="password"
              />
            </div>
            <button
              type="submit"
              className="h-11 w-fit rounded-lg bg-danger px-5 font-sans text-sm font-bold text-on-danger transition-colors hover:bg-danger/90"
            >
              Permanently delete account
            </button>
          </form>
        </section>
      </div>

      <form action={signOutFromSettings} className="mt-auto border-t border-muted-background pt-6">
        <button
          type="submit"
          className="h-11 rounded-lg bg-danger px-5 font-sans text-sm font-bold text-on-danger transition-colors hover:bg-danger/90"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
