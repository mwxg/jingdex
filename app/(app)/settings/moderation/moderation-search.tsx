"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  canEditRole,
  getAssignableRoles,
  type AppRole,
} from "@/lib/auth/roles";
import {
  getUserSearchPage,
  getUserTagsForManagement,
  setUserTagForManagement,
  submitUserModeration,
  type TagManagementState,
  type UserSearchResult,
  type UserSearchState,
} from "./actions";
import { InlineLoadingStatus, PendingLabel } from "@/components/loading";
import { UsernameLink } from "@/components/username-link";
import { UserTagBadge } from "@/components/user-tag";

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

function SearchingStatus({ isSearching }: Readonly<{ isSearching: boolean }>) {
  if (!isSearching) {
    return null;
  }

  return <InlineLoadingStatus label="Searching…" />;
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
          <p className="font-sans text-sm text-muted">
            <UsernameLink username={user.username} />
          </p>
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
              className="h-10 rounded-lg bg-primary px-4 font-sans text-sm font-bold text-on-primary transition-colors hover:bg-primary/90"
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

function TagManagementModal({
  onClose,
  onToggle,
  pendingTagId,
  state,
  user,
}: Readonly<{
  onClose: () => void;
  onToggle: (tagId: string, shouldAssign: boolean) => void;
  pendingTagId: string | null;
  state: TagManagementState;
  user: UserSearchResult;
}>) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const assignedTags = (state.tags ?? []).filter((tag) => tag.is_assigned);

  useEffect(() => {
    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    closeButtonRef.current?.focus();

    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [onClose]);

  return (
    <div
      aria-labelledby="tag-management-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 px-4 py-6"
      role="dialog"
    >
      <div className="max-h-full w-full max-w-2xl overflow-y-auto rounded-lg border border-muted-background bg-surface p-5 shadow-lg sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h2
              className="font-heading text-2xl font-semibold text-foreground"
              id="tag-management-title"
            >
              Manage tags
            </h2>
            <p className="font-sans text-sm text-muted">
              <UsernameLink username={user.username} />
            </p>
          </div>
          <button
            aria-label="Close tag management"
            className="grid size-11 shrink-0 place-items-center rounded-lg text-2xl leading-none text-foreground transition-colors hover:bg-muted-background"
            onClick={onClose}
            ref={closeButtonRef}
            type="button"
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </div>

        <div aria-live="polite" className="mt-4">
          {state.message ? (
            <p className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 font-sans text-sm font-bold text-danger" role="alert">
              {state.message}
            </p>
          ) : state.success ? (
            <p className="rounded-lg border border-confirm/30 bg-confirm/10 px-4 py-3 font-sans text-sm font-bold text-confirm" role="status">
              {state.success}
            </p>
          ) : null}
        </div>

        <section className="mt-5" aria-labelledby="current-tags-title">
          <h3 className="font-heading text-lg font-semibold text-foreground" id="current-tags-title">
            Current tags
          </h3>
          {assignedTags.length > 0 ? (
            <ul className="mt-3 flex flex-wrap gap-2">
              {assignedTags.map((tag) => (
                <li key={tag.id}><UserTagBadge tag={tag} /></li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 font-sans text-sm text-muted">No tags assigned.</p>
          )}
        </section>

        <section className="mt-6" aria-labelledby="available-tags-title">
          <h3 className="font-heading text-lg font-semibold text-foreground" id="available-tags-title">
            All available tags
          </h3>
          {state.tags ? (
            <ul className="mt-3 divide-y divide-muted-background rounded-lg border border-muted-background">
              {state.tags.map((tag) => (
                <li className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between" key={tag.id}>
                  <div className="min-w-0 space-y-2">
                    <UserTagBadge tag={tag} />
                    <p className="font-sans text-sm text-muted">
                      {tag.description || "No description."}
                      {tag.is_automatic ? " Automatic tag." : " Manual tag."}
                    </p>
                  </div>
                  <button
                    className={`min-h-11 shrink-0 rounded-lg px-4 font-sans text-sm font-bold transition-colors disabled:cursor-wait disabled:opacity-60 ${tag.is_assigned ? "border border-danger/40 text-danger hover:bg-danger/10" : "bg-primary text-on-primary hover:bg-primary/90"}`}
                    disabled={pendingTagId !== null || tag.is_automatic}
                    onClick={() => onToggle(tag.id, !tag.is_assigned)}
                    type="button"
                  >
                    {tag.is_automatic ? (
                      "Managed automatically"
                    ) : pendingTagId === tag.id ? (
                      <PendingLabel>Updating tags</PendingLabel>
                    ) : tag.is_assigned ? (
                      `Remove ${tag.label}`
                    ) : (
                      `Add ${tag.label}`
                    )}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <InlineLoadingStatus label="Loading tags" />
          )}
        </section>
      </div>
    </div>
  );
}

export function ModerationSearch({
  canManageUserTags,
  initialState,
}: Readonly<{
  canManageUserTags: boolean;
  initialState: UserSearchState;
}>) {
  const [state, setState] = useState<UserSearchState>(initialState);
  const [inputValue, setInputValue] = useState(initialState.query ?? "");
  const [isPending, startTransition] = useTransition();
  const requestId = useRef(0);
  const [selectedRoleUser, setSelectedRoleUser] = useState<UserSearchResult | null>(
    null,
  );
  const [selectedTagUser, setSelectedTagUser] = useState<UserSearchResult | null>(null);
  const [tagState, setTagState] = useState<TagManagementState>({});
  const [, startTagTransition] = useTransition();
  const [pendingTagId, setPendingTagId] = useState<string | null>(null);
  const tagRequestId = useRef(0);
  const results = state.results ?? [];
  const page = state.page ?? 1;
  const query = state.query ?? "";
  const totalCount = state.totalCount ?? 0;
  const currentUserId = state.currentUserId;
  const currentUserRole = state.currentUserRole;
  const allowedRoles = getAssignableRoles(currentUserRole);
  const hasQuery = query.length > 0;
  const isSearching = isPending && inputValue.trim().length > 0;

  const searchUsers = useCallback((nextQuery: string) => {
    const currentRequestId = requestId.current + 1;
    requestId.current = currentRequestId;

    startTransition(async () => {
      const nextState = await getUserSearchPage(nextQuery, 1);

      if (requestId.current === currentRequestId) {
        setState(nextState);
      }
    });
  }, []);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    searchUsers(inputValue);
  }

  function updateSelectedUserRole(formData: FormData) {
    setSelectedRoleUser(null);
    startTransition(async () => {
      const nextState = await submitUserModeration(state, formData);
      setState(nextState);
    });
  }

  function openTagManagement(user: UserSearchResult) {
    const requestId = tagRequestId.current + 1;
    tagRequestId.current = requestId;
    setSelectedTagUser(user);
    setTagState({});
    setPendingTagId(null);
    startTagTransition(async () => {
      const nextState = await getUserTagsForManagement(user.id);
      if (tagRequestId.current === requestId) setTagState(nextState);
    });
  }

  function updateSelectedUserTag(tagId: string, shouldAssign: boolean) {
    if (!selectedTagUser) return;
    const requestId = tagRequestId.current + 1;
    tagRequestId.current = requestId;
    setPendingTagId(tagId);
    startTagTransition(async () => {
      const nextState = await setUserTagForManagement(
        selectedTagUser.id,
        tagId,
        shouldAssign,
      );
      if (tagRequestId.current === requestId) {
        setTagState(nextState);
        setPendingTagId(null);
      }
    });
  }

  const closeTagManagement = useCallback(() => {
    tagRequestId.current += 1;
    setSelectedTagUser(null);
    setPendingTagId(null);
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      searchUsers(inputValue);
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [inputValue, searchUsers]);

  return (
    <section className="rounded-lg border border-muted-background bg-surface p-6">
      <form aria-busy={isPending} className="space-y-5" onSubmit={submitSearch}>
        <div className="space-y-2">
          <h2 className="font-heading text-2xl font-semibold text-foreground">
            User search
          </h2>
        </div>

        <SearchMessage state={state} />

        <div>
          <label className="flex-1 space-y-2">
            <span className="block font-sans text-sm font-bold text-foreground">
              Email or username
            </span>
            <input
              className="h-12 w-full rounded-lg border border-muted-background bg-surface px-4 font-sans text-base text-foreground outline-none transition-colors placeholder:text-muted focus:border-primary"
              name="query"
              onChange={(event) => setInputValue(event.target.value)}
              placeholder="gareth or name@example.com"
              type="search"
              value={inputValue}
            />
          </label>
        </div>

        <SearchingStatus isSearching={isSearching} />
      </form>

      {hasQuery && results.length > 0 ? (
        <div className="mt-6 overflow-hidden rounded-lg border border-muted-background lg:overflow-x-auto">
          <div className="lg:min-w-248">
            <div className="hidden grid-cols-[minmax(10rem,1fr)_minmax(14rem,1.35fr)_13rem_7rem_9rem] items-center gap-4 border-b border-muted-background bg-muted-background px-4 py-3 font-sans text-sm font-bold text-muted lg:grid">
              <span>Username</span>
              <span>Email</span>
              <span>Created</span>
              <span>Role</span>
              <span className="text-right">Actions</span>
            </div>
            <ul className="divide-y divide-muted-background">
              {results.map((user) => (
                <li
                  key={user.id}
                  className="grid gap-3 px-4 py-4 font-sans text-sm lg:grid-cols-[minmax(10rem,1fr)_minmax(14rem,1.35fr)_13rem_7rem_9rem] lg:items-center lg:gap-4"
                >
                  <div className="grid min-w-0 grid-cols-[5.5rem_minmax(0,1fr)] gap-3 lg:block">
                    <span className="font-bold text-muted lg:hidden">Username</span>
                    <UsernameLink
                      className="block min-w-0 truncate font-bold text-foreground underline decoration-muted underline-offset-2 transition-colors hover:text-primary"
                      username={user.username}
                    />
                  </div>
                  <div className="grid min-w-0 grid-cols-[5.5rem_minmax(0,1fr)] gap-3 lg:block">
                    <span className="font-bold text-muted lg:hidden">Email</span>
                    <span className="min-w-0 break-all text-muted lg:block lg:truncate">
                      {user.email}
                    </span>
                  </div>
                  <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-3 lg:block">
                    <span className="font-bold text-muted lg:hidden">Created</span>
                    <span className="text-muted lg:whitespace-nowrap">
                      {new Date(user.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-3 lg:block">
                    <span className="font-bold text-muted lg:hidden">Role</span>
                    <span className="whitespace-nowrap text-muted">
                      {user.role}
                    </span>
                  </div>
                  <span className="flex flex-wrap gap-2 pl-25 lg:justify-end lg:pl-0">
                    {canEditUser(currentUserId, currentUserRole, user) ? (
                      <button
                        className="min-h-11 rounded-lg border border-muted-background px-4 font-sans text-xs font-bold text-foreground transition-colors hover:border-primary hover:text-primary lg:min-h-9 lg:px-3"
                        onClick={() => setSelectedRoleUser(user)}
                        type="button"
                      >
                        Edit
                      </button>
                    ) : null}
                    {canManageUserTags ? (
                      <button
                        className="min-h-11 rounded-lg border border-muted-background px-4 font-sans text-xs font-bold text-foreground transition-colors hover:border-primary hover:text-primary lg:min-h-9 lg:px-3"
                        onClick={() => openTagManagement(user)}
                        type="button"
                      >
                        Tags
                      </button>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {hasQuery && results.length === 0 && !state.message ? (
        <p className="mt-6 rounded-lg border border-muted-background bg-background px-4 py-3 font-sans text-sm text-muted">
          No users found.
        </p>
      ) : null}

      {hasQuery && results.length > 0 ? (
        <div className="mt-4 flex flex-col gap-2 font-sans text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <span>
            Showing {results.length} of {totalCount} matches
          </span>
          {totalCount > results.length ? (
            <span>Only the first {results.length} users are shown.</span>
          ) : null}
        </div>
      ) : null}

      {selectedRoleUser ? (
        <RoleEditModal
          action={updateSelectedUserRole}
          allowedRoles={allowedRoles}
          onClose={() => setSelectedRoleUser(null)}
          page={page}
          query={query}
          user={selectedRoleUser}
        />
      ) : null}
      {selectedTagUser ? (
        <TagManagementModal
          onClose={closeTagManagement}
          onToggle={updateSelectedUserTag}
          pendingTagId={pendingTagId}
          state={tagState}
          user={selectedTagUser}
        />
      ) : null}
    </section>
  );
}
