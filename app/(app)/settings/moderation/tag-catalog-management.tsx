"use client";

import { type FormEvent, useMemo, useState, useTransition } from "react";
import { InlineLoadingStatus, PendingLabel } from "@/components/loading";
import { UserTagBadge } from "@/components/user-tag";
import {
  type TagStyle,
  type UserTag,
} from "@/lib/tags";
import {
  createManualTagForManagement,
  createTagStyleForManagement,
  deleteManualTagForManagement,
  reorderTagsForManagement,
  type TagCatalogState,
} from "./actions";

function CatalogMessage({ state }: Readonly<{ state: TagCatalogState }>) {
  if (state.message) {
    return (
      <p className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 font-sans text-sm font-bold text-danger" role="alert">
        {state.message}
      </p>
    );
  }

  if (state.success) {
    return (
      <p className="rounded-lg border border-confirm/30 bg-confirm/10 px-4 py-3 font-sans text-sm font-bold text-confirm" role="status">
        {state.success}
      </p>
    );
  }

  return null;
}

function makePreviewTag(label: string, style: TagStyle): UserTag {
  return {
    id: "preview",
    slug: "preview",
    label: label.trim() || "Tag preview",
    description: null,
    style_id: style.id,
    style_slug: style.slug,
    style_label: style.label,
    light_color: style.light_color,
    dark_color: style.dark_color,
    is_automatic: false,
  };
}

function ThemePreviews({ tag }: Readonly<{ tag: UserTag }>) {
  return (
    <div className="grid gap-3 sm:grid-cols-2" aria-label="Tag theme previews">
      <div className="tag-preview-light rounded-lg border border-[#d9ddd8] p-4">
        <p className="mb-3 font-sans text-xs font-bold uppercase tracking-wide">Light mode</p>
        <UserTagBadge previewTheme="light" tag={tag} />
      </div>
      <div className="tag-preview-dark rounded-lg border border-[#394443] p-4">
        <p className="mb-3 font-sans text-xs font-bold uppercase tracking-wide">Dark mode</p>
        <UserTagBadge previewTheme="dark" tag={tag} />
      </div>
    </div>
  );
}

export function TagCatalogManagement({
  initialState,
}: Readonly<{
  initialState: TagCatalogState;
}>) {
  const [state, setState] = useState(initialState);
  const [isPending, startTransition] = useTransition();
  const [pendingOperation, setPendingOperation] = useState<
    "style" | "tag" | "delete" | "reorder" | null
  >(null);
  const [deletingTagId, setDeletingTagId] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [tagLabel, setTagLabel] = useState("");
  const [selectedStyleId, setSelectedStyleId] = useState(
    initialState.styles[0]?.id ?? "",
  );
  const [styleLabel, setStyleLabel] = useState("");
  const [lightColor, setLightColor] = useState("#3458a4");
  const [darkColor, setDarkColor] = useState("#8cabef");

  const selectedStyle =
    state.styles.find((style) => style.id === selectedStyleId) ??
    state.styles[0] ??
    null;
  const tagPreview = selectedStyle
    ? makePreviewTag(tagLabel, selectedStyle)
    : null;
  const pendingStyle = useMemo<TagStyle>(
    () => ({
      id: "new-style",
      slug: "new-style",
      label: styleLabel.trim() || "New style",
      light_color: lightColor,
      dark_color: darkColor,
      is_system: false,
    }),
    [darkColor, lightColor, styleLabel],
  );
  const stylePreview = makePreviewTag("Tag preview", pendingStyle);

  function createStyle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const requestedSlug = String(formData.get("styleSlug") ?? "");

    setPendingOperation("style");
    startTransition(async () => {
      const nextState = await createTagStyleForManagement(formData);
      setState(nextState);
      if (nextState.success) {
        form.reset();
        setStyleLabel("");
        setLightColor("#3458a4");
        setDarkColor("#8cabef");
        const createdStyle = nextState.styles.find(
          (style) => style.slug === requestedSlug.trim().toLowerCase(),
        );
        if (createdStyle) setSelectedStyleId(createdStyle.id);
      }
      setPendingOperation(null);
    });
  }

  function createTag(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    setPendingOperation("tag");
    startTransition(async () => {
      const nextState = await createManualTagForManagement(formData);
      setState(nextState);
      if (nextState.success) {
        form.reset();
        setTagLabel("");
        setSelectedStyleId(nextState.styles[0]?.id ?? "");
      }
      setPendingOperation(null);
    });
  }

  function deleteTag(tagId: string, label: string) {
    if (!window.confirm(`Delete the ${label} tag from every user?`)) return;

    setDeletingTagId(tagId);
    setPendingOperation("delete");
    startTransition(async () => {
      setState(await deleteManualTagForManagement(tagId));
      setDeletingTagId(null);
      setPendingOperation(null);
    });
  }

  function moveTag(from: number, to: number) {
    if (to < 0 || to >= state.tags.length || from === to || isPending) return;
    const nextTags = [...state.tags];
    const [tag] = nextTags.splice(from, 1);
    nextTags.splice(to, 0, tag);
    setState((current) => ({ ...current, message: undefined, success: undefined, tags: nextTags }));

    setPendingOperation("reorder");
    startTransition(async () => {
      setState(await reorderTagsForManagement(nextTags.map((item) => item.id)));
      setPendingOperation(null);
    });
  }

  return (
    <section className="rounded-lg border border-muted-background bg-surface p-5 sm:p-6">
      <div className="space-y-2">
        <h2 className="font-heading text-2xl font-semibold text-foreground">Tag catalog</h2>
        <p className="font-sans text-sm leading-6 text-muted">
          Create reusable color styles and manual tags. Drag any tag to change the order shown on profiles.
        </p>
      </div>

      <div className="mt-5" aria-live="polite">
        <CatalogMessage state={state} />
      </div>

      <section className="mt-6 rounded-lg border border-muted-background bg-background p-4 sm:p-5" aria-labelledby="create-style-heading">
        <h3 className="font-heading text-xl font-semibold text-foreground" id="create-style-heading">Create a style</h3>
        <form className="mt-4 space-y-5" onSubmit={createStyle}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="block font-sans text-sm font-bold text-foreground">Style name</span>
              <input className="h-12 w-full rounded-lg border border-muted-background bg-surface px-4 font-sans text-base text-foreground outline-none focus:border-primary" maxLength={40} name="styleLabel" onChange={(event) => setStyleLabel(event.target.value)} placeholder="Ambassador" required value={styleLabel} />
            </label>
            <label className="space-y-2">
              <span className="block font-sans text-sm font-bold text-foreground">Style slug</span>
              <input className="h-12 w-full rounded-lg border border-muted-background bg-surface px-4 font-sans text-base text-foreground outline-none focus:border-primary" name="styleSlug" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="ambassador" required />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="block font-sans text-sm font-bold text-foreground">Light-mode color</span>
              <div className="flex gap-3">
                <input aria-label="Choose light-mode color" className="h-12 w-16 cursor-pointer rounded-lg border border-muted-background bg-surface p-1" name="lightColor" onChange={(event) => setLightColor(event.target.value)} type="color" value={lightColor} />
                <output className="flex h-12 flex-1 items-center rounded-lg border border-muted-background bg-surface px-4 font-mono text-sm text-foreground">{lightColor}</output>
              </div>
            </label>
            <label className="space-y-2">
              <span className="block font-sans text-sm font-bold text-foreground">Dark-mode color</span>
              <div className="flex gap-3">
                <input aria-label="Choose dark-mode color" className="h-12 w-16 cursor-pointer rounded-lg border border-muted-background bg-surface p-1" name="darkColor" onChange={(event) => setDarkColor(event.target.value)} type="color" value={darkColor} />
                <output className="flex h-12 flex-1 items-center rounded-lg border border-muted-background bg-surface px-4 font-mono text-sm text-foreground">{darkColor}</output>
              </div>
            </label>
          </div>

          <ThemePreviews tag={stylePreview} />

          <button className="min-h-11 rounded-lg bg-primary px-5 font-sans text-sm font-bold text-on-primary hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60" disabled={isPending} type="submit">
            {pendingOperation === "style" ? <PendingLabel>Creating style</PendingLabel> : "Create style"}
          </button>
        </form>
      </section>

      <section className="mt-6 rounded-lg border border-muted-background bg-background p-4 sm:p-5" aria-labelledby="create-tag-heading">
        <h3 className="font-heading text-xl font-semibold text-foreground" id="create-tag-heading">Create a manual tag</h3>
        <form className="mt-4 space-y-5" onSubmit={createTag}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="block font-sans text-sm font-bold text-foreground">Label</span>
              <input className="h-12 w-full rounded-lg border border-muted-background bg-surface px-4 font-sans text-base text-foreground outline-none focus:border-primary" maxLength={40} name="label" onChange={(event) => setTagLabel(event.target.value)} placeholder="Early Adopter" required value={tagLabel} />
            </label>
            <label className="space-y-2">
              <span className="block font-sans text-sm font-bold text-foreground">Slug</span>
              <input className="h-12 w-full rounded-lg border border-muted-background bg-surface px-4 font-sans text-base text-foreground outline-none focus:border-primary" name="slug" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="early-adopter" required />
            </label>
          </div>
          <label className="space-y-2">
            <span className="block font-sans text-sm font-bold text-foreground">Description</span>
            <textarea className="min-h-24 w-full resize-y rounded-lg border border-muted-background bg-surface px-4 py-3 font-sans text-base text-foreground outline-none focus:border-primary" maxLength={240} name="description" placeholder="Shown when users inspect the tag." />
          </label>
          <label className="block max-w-md space-y-2">
            <span className="block font-sans text-sm font-bold text-foreground">Style</span>
            <select className="h-12 w-full rounded-lg border border-muted-background bg-surface px-4 font-sans text-base text-foreground outline-none focus:border-primary" name="styleId" onChange={(event) => setSelectedStyleId(event.target.value)} required value={selectedStyle?.id ?? ""}>
              {state.styles.map((style) => <option key={style.id} value={style.id}>{style.label}</option>)}
            </select>
          </label>

          {tagPreview ? <ThemePreviews tag={tagPreview} /> : (
            <p className="font-sans text-sm text-danger" role="alert">Create a style before creating a tag.</p>
          )}

          <button className="min-h-11 rounded-lg bg-primary px-5 font-sans text-sm font-bold text-on-primary hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60" disabled={isPending || !selectedStyle} type="submit">
            {pendingOperation === "tag" ? <PendingLabel>Creating tag</PendingLabel> : "Create tag"}
          </button>
        </form>
      </section>

      <div className="mt-8">
        <h3 className="font-heading text-xl font-semibold text-foreground">Display order</h3>
        <p className="mt-1 font-sans text-sm text-muted">Drag tags, or use the move buttons for keyboard-accessible ordering.</p>
        {pendingOperation === "reorder" ? (
          <div className="mt-3"><InlineLoadingStatus label="Saving tag order" /></div>
        ) : null}
        {state.tags.length > 0 ? (
          <ol className="mt-3 divide-y divide-muted-background rounded-lg border border-muted-background">
            {state.tags.map((tag, index) => (
              <li
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center"
                draggable={!isPending}
                key={tag.id}
                onDragEnd={() => setDraggedIndex(null)}
                onDragOver={(event) => event.preventDefault()}
                onDragStart={() => setDraggedIndex(index)}
                onDrop={() => {
                  if (draggedIndex !== null) moveTag(draggedIndex, index);
                  setDraggedIndex(null);
                }}
              >
                <span aria-hidden="true" className="cursor-grab select-none text-xl font-bold text-muted">⋮⋮</span>
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <UserTagBadge tag={tag} />
                    <span className="font-sans text-xs font-bold text-muted">{tag.is_automatic ? "Automatic" : "Manual"} · {tag.style_label}</span>
                  </div>
                  <p className="font-sans text-sm text-muted">{tag.description || "No description."}</p>
                </div>
                <div className="flex flex-wrap gap-2 sm:justify-end">
                  <button aria-label={`Move ${tag.label} up`} className="size-11 rounded-lg border border-muted-background font-bold text-foreground hover:border-primary disabled:opacity-30" disabled={isPending || index === 0} onClick={() => moveTag(index, index - 1)} type="button">↑</button>
                  <button aria-label={`Move ${tag.label} down`} className="size-11 rounded-lg border border-muted-background font-bold text-foreground hover:border-primary disabled:opacity-30" disabled={isPending || index === state.tags.length - 1} onClick={() => moveTag(index, index + 1)} type="button">↓</button>
                  <button className="min-h-11 rounded-lg border border-danger/40 px-4 font-sans text-sm font-bold text-danger hover:bg-danger/10 disabled:cursor-not-allowed disabled:border-muted-background disabled:text-muted disabled:hover:bg-transparent" disabled={isPending || tag.is_automatic} onClick={() => deleteTag(tag.id, tag.label)} type="button">
                    {deletingTagId === tag.id ? <PendingLabel>Deleting tag</PendingLabel> : tag.is_automatic ? "Protected" : "Delete"}
                  </button>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-3 font-sans text-sm text-muted">No tags found.</p>
        )}
      </div>
    </section>
  );
}
