import type { CSSProperties } from "react";
import type { UserTag } from "@/lib/tags";

type TagColorProperties = CSSProperties & {
  "--tag-color-light": string;
  "--tag-color-light-end": string;
  "--tag-color-dark": string;
  "--tag-color-dark-end": string;
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
    "--tag-color-light-end": tag.light_color_end,
    "--tag-color-dark": tag.dark_color,
    "--tag-color-dark-end": tag.dark_color_end,
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
