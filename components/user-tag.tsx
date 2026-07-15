import { isTagStyleKey, type UserTag } from "@/lib/tags";

const tagStyleClasses = {
  neutral: "border-tag-neutral bg-tag-neutral/10 text-tag-neutral",
  moderator: "border-moderator bg-moderator/10 text-moderator",
  admin: "border-admin bg-admin/10 text-admin",
  developer: "border-developer bg-developer/10 text-developer",
  contributor: "border-contributor bg-contributor/10 text-contributor",
  supporter: "border-supporter bg-supporter/10 text-supporter",
} as const;

export function getTagStyleClasses(styleKey: string) {
  return tagStyleClasses[isTagStyleKey(styleKey) ? styleKey : "neutral"];
}

export function UserTagBadge({ tag }: Readonly<{ tag: UserTag }>) {
  return (
    <span
      aria-label={tag.description ? `${tag.label}: ${tag.description}` : tag.label}
      className={`inline-flex min-h-7 items-center rounded-full border-2 px-3 py-1 font-sans text-xs font-bold ${getTagStyleClasses(tag.style_key)}`}
      title={tag.description ?? undefined}
    >
      {tag.label}
    </span>
  );
}
