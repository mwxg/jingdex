"use client";

import { useActionState, useState } from "react";
import {
  canEditRole,
  getAssignableRoles,
  type AppRole,
} from "@/lib/auth/roles";
import {
  submitUserModeration,
  type UserSearchResult,
  type UserSearchState,
} from "./actions";

const USERS_PER_PAGE = 20;

function canEditUser(
  currentUserId: string | undefined,
  currentUserRole: UserSearchResult["role"] | undefined,
  user: UserSearchResult,
) {
  if (!currentUserId || user.id === currentUserId) {
    return false;
  }

  return canEditRole(currentUserRole, user.role);
}

function SearchMessage({ state }: Readonly<{ state: UserSearchState }>) {
  if (!state.message) {
    if (!state.success) {
      return null;
    }

    return (
      <p className="rounded-lg border border-confirm/30 bg-confirm/10 px-4 py-3 font-sans text-sm font-bold text-confirm">
        {state.success}
      </p>
    );
  }

  return (
    <p className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 font-sans text-sm font-bold text-danger">
      {state.message}
    </p>
  );
}

function RoleEditModal({
  action,
  allowedRoles,
  onClose,
  page,
  query,
  user,
}: Readonly<{
  action: (formData: FormData) => void;
  allowedRoles: readonly AppRole[];
  onClose: () => void;
  page: number;
  query: string;
  user: UserSearchResult;
}>) {
  return (
    <div
      aria-labelledby="role-edit-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 px-4"
      role="dialog"
    >
      <div className="w-full max-w-md rounded-lg border border-muted-background bg-surface p-6 shadow-lg">
        <div className="space-y-2">
          <h2
            id="role-edit-title"
            className="font-heading text-2xl font-semibold text-foreground"
          >
            Edit role
          </h2>
          <p className="font-sans text-sm text-muted">{user.username}</p>
        </div>

        <form action={action} className="mt-5 space-y-5">
          <input name="intent" type="hidden" value="updateRole" />
          <input name="targetUserId" type="hidden" value={user.id} />
          <input name="query" type="hidden" value={query} />
          <input name="page" type="hidden" value={page} />

          <label className="block space-y-2">
            <span className="block font-sans text-sm font-bold text-foreground">
              Role
            </span>
            <select
              className="h-12 w-full rounded-lg border border-muted-background bg-surface px-4 font-sans text-base text-foreground outline-none transition-colors focus:border-primary"
              defaultValue={user.role}
              name="role"
            >
              {allowedRoles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>

          <div className="flex justify-end gap-2">
            <button
              className="h-10 rounded-lg border border-muted-background px-4 font-sans text-sm font-bold text-foreground transition-colors hover:border-primary hover:text-primary"
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className="h-10 rounded-lg bg-primary px-4 font-sans text-sm font-bold text-text-light transition-colors hover:bg-primary/90"
              type="submit"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ModerationSearch({
  initialState,
}: Readonly<{
  initialState: UserSearchState;
}>) {
  const [state, formAction] = useActionState(
    submitUserModeration,
    initialState,
  );
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(
    null,
  );
  const results = state.results ?? [];
  const page = state.page ?? 1;
  const query = state.query ?? "";
  const totalCount = state.totalCount ?? 0;
  const currentUserId = state.currentUserId;
  const currentUserRole = state.currentUserRole;
  const allowedRoles = getAssignableRoles(currentUserRole);
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
        <div className="mt-6 overflow-x-auto rounded-lg border border-muted-background">
          <div className="min-w-[62rem]">
            <div className="grid grid-cols-[minmax(10rem,1fr)_minmax(14rem,1.35fr)_13rem_7rem_4.5rem] items-center gap-4 border-b border-muted-background bg-muted-background px-4 py-3 font-sans text-sm font-bold text-muted">
              <span>Username</span>
              <span>Email</span>
              <span>Created</span>
              <span>Role</span>
              <span className="text-right">Edit</span>
            </div>
            <ul className="divide-y divide-muted-background">
              {results.map((user) => (
                <li
                  key={user.id}
                  className="grid grid-cols-[minmax(10rem,1fr)_minmax(14rem,1.35fr)_13rem_7rem_4.5rem] items-center gap-4 px-4 py-4 font-sans text-sm"
                >
                  <span className="min-w-0 truncate font-bold text-foreground">
                    {user.username}
                  </span>
                  <span className="min-w-0 truncate text-muted">
                    {user.email}
                  </span>
                  <span className="whitespace-nowrap text-muted">
                    {new Date(user.created_at).toLocaleString()}
                  </span>
                  <span className="whitespace-nowrap text-muted">
                    {user.role}
                  </span>
                  <span className="text-right">
                    {canEditUser(currentUserId, currentUserRole, user) ? (
                      <button
                        className="h-9 rounded-lg border border-muted-background px-3 font-sans text-xs font-bold text-foreground transition-colors hover:border-primary hover:text-primary"
                        onClick={() => setSelectedUser(user)}
                        type="button"
                      >
                        Edit
                      </button>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          </div>
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

      {selectedUser ? (
        <RoleEditModal
          action={(formData) => {
            setSelectedUser(null);
            formAction(formData);
          }}
          allowedRoles={allowedRoles}
          onClose={() => setSelectedUser(null)}
          page={page}
          query={query}
          user={selectedUser}
        />
      ) : null}
    </section>
  );
}
