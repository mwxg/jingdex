"use client";

import { useActionState } from "react";
import { searchUsers, type UserSearchState } from "./actions";

function SearchMessage({ state }: Readonly<{ state: UserSearchState }>) {
  if (!state.message) {
    return null;
  }

  return (
    <p className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 font-sans text-sm font-bold text-danger">
      {state.message}
    </p>
  );
}

export function ModerationSearch() {
  const [state, formAction] = useActionState(searchUsers, {});
  const results = state.results ?? [];

  return (
    <section className="rounded-lg border border-muted-background bg-surface p-6">
      <form action={formAction} className="space-y-5">
        <div className="space-y-2">
          <h2 className="font-heading text-2xl font-semibold text-foreground">
            User search
          </h2>
        </div>

        <SearchMessage state={state} />

        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="flex-1 space-y-2">
            <span className="block font-sans text-sm font-bold text-foreground">
              Email or username
            </span>
            <input
              className="h-12 w-full rounded-lg border border-muted-background bg-surface px-4 font-sans text-base text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary"
              name="query"
              placeholder="gareth or name@example.com"
              required
              type="search"
            />
          </label>
          <button
            type="submit"
            className="h-12 rounded-lg bg-primary px-5 font-sans text-sm font-bold text-text-light transition-colors hover:bg-primary/90 sm:self-end"
          >
            Search
          </button>
        </div>
      </form>

      {results.length > 0 ? (
        <div className="mt-6 overflow-hidden rounded-lg border border-muted-background">
          <div className="grid grid-cols-[1fr_auto] gap-3 border-b border-muted-background bg-muted-background px-4 py-3 font-sans text-sm font-bold text-muted md:grid-cols-[1fr_1fr_auto]">
            <span>Username</span>
            <span className="hidden md:block">Email</span>
            <span>Role</span>
          </div>
          <ul className="divide-y divide-muted-background">
            {results.map((user) => (
              <li
                key={user.id}
                className="grid grid-cols-[1fr_auto] gap-3 px-4 py-4 font-sans text-sm md:grid-cols-[1fr_1fr_auto]"
              >
                <span className="font-bold text-foreground">
                  {user.username}
                </span>
                <span className="hidden truncate text-muted md:block">
                  {user.email}
                </span>
                <span className="text-muted">{user.role}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
