"use client";

import { useActionState } from "react";
import { searchUsers, type UserSearchState } from "./actions";

const USERS_PER_PAGE = 20;

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

export function ModerationSearch({
  initialState,
}: Readonly<{
  initialState: UserSearchState;
}>) {
  const [state, formAction] = useActionState(searchUsers, initialState);
  const results = state.results ?? [];
  const page = state.page ?? 1;
  const query = state.query ?? "";
  const totalCount = state.totalCount ?? 0;
  const firstResult = totalCount > 0 ? (page - 1) * USERS_PER_PAGE + 1 : 0;
  const lastResult = Math.min(page * USERS_PER_PAGE, totalCount);
  const hasPreviousPage = page > 1;
  const hasNextPage = lastResult < totalCount;

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
              defaultValue={query}
              name="query"
              placeholder="gareth or name@example.com"
              type="search"
            />
          </label>
          <button
            name="page"
            type="submit"
            value="1"
            className="h-12 rounded-lg bg-primary px-5 font-sans text-sm font-bold text-text-light transition-colors hover:bg-primary/90 sm:self-end"
          >
            Search
          </button>
        </div>
      </form>

      {results.length > 0 ? (
        <div className="mt-6 overflow-hidden rounded-lg border border-muted-background">
          <div className="grid grid-cols-[1fr_auto] gap-3 border-b border-muted-background bg-muted-background px-4 py-3 font-sans text-sm font-bold text-muted md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_auto_auto]">
            <span>Username</span>
            <span className="hidden md:block">Email</span>
            <span>Role</span>
            <span className="hidden text-right md:block">Created</span>
          </div>
          <ul className="divide-y divide-muted-background">
            {results.map((user) => (
              <li
                key={user.id}
                className="grid grid-cols-[1fr_auto] gap-3 px-4 py-4 font-sans text-sm md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_auto_auto]"
              >
                <div className="min-w-0 space-y-1">
                  <span className="block truncate font-bold text-foreground">
                    {user.username}
                  </span>
                  <span className="block text-xs text-muted md:hidden">
                    {new Date(user.created_at).toLocaleString()}
                  </span>
                </div>
                <span className="hidden min-w-0 truncate text-muted md:block">
                  {user.email}
                </span>
                <span className="text-muted">{user.role}</span>
                <span className="hidden text-right text-muted md:block">
                  {new Date(user.created_at).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-6 rounded-lg border border-muted-background bg-background px-4 py-3 font-sans text-sm text-muted">
          No users found.
        </p>
      )}

      <div className="mt-4 flex flex-col gap-3 font-sans text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <span>
          Showing {firstResult}-{lastResult} of {totalCount}
        </span>
        <div className="flex gap-2">
          <form action={formAction}>
            <input name="query" type="hidden" value={query} />
            <button
              className="h-10 rounded-lg border border-muted-background px-4 font-bold text-foreground transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!hasPreviousPage}
              name="page"
              type="submit"
              value={page - 1}
            >
              Previous
            </button>
          </form>
          <form action={formAction}>
            <input name="query" type="hidden" value={query} />
            <button
              className="h-10 rounded-lg border border-muted-background px-4 font-bold text-foreground transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!hasNextPage}
              name="page"
              type="submit"
              value={page + 1}
            >
              Next
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
