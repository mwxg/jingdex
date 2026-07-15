import { isTagStyleKey, type UserTag } from "@/lib/tags";

const tagStyleClasses = {
  neutral: "border-tag-neutral bg-tag-neutral text-on-tag",
  moderator: "border-moderator bg-moderator text-on-role",
  admin: "border-admin bg-admin text-on-role",
  developer: "border-developer bg-developer text-on-role",
  contributor: "border-contributor bg-contributor text-on-tag",
  supporter: "border-supporter bg-supporter text-on-tag",
} as const;

export function getTagStyleClasses(styleKey: string) {
  return tagStyleClasses[isTagStyleKey(styleKey) ? styleKey : "neutral"];
}

export function UserTagBadge({ tag }: Readonly<{ tag: UserTag }>) {
  return (
    <span
      aria-label={tag.description ? `${tag.label}: ${tag.description}` : tag.label}
      className={`inline-flex min-h-7 items-center rounded-full border px-3 py-1 font-sans text-xs font-bold ${getTagStyleClasses(tag.style_key)}`}
      title={tag.description ?? undefined}
    >
      {tag.label}
    </span>
  );
}
