import type { CSSProperties } from "react";
import type { UserTag } from "@/lib/tags";

type TagColorProperties = CSSProperties & {
  "--tag-color-light": string;
  "--tag-color-dark": string;
};

export function UserTagBadge({
  previewTheme,
  tag,
}: Readonly<{
  previewTheme?: "light" | "dark";
  tag: UserTag;
}>) {
  const previewClass = previewTheme ? `user-tag-preview-${previewTheme}` : "";
  const style: TagColorProperties = {
    "--tag-color-light": tag.light_color,
    "--tag-color-dark": tag.dark_color,
  };

  return (
    <span
      aria-label={tag.description ? `${tag.label}: ${tag.description}` : tag.label}
      className={`user-tag-badge ${previewClass}`}
      style={style}
      title={tag.description ?? undefined}
    >
      {tag.label}
    </span>
  );
}
