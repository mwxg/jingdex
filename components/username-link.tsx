import Link from "next/link";

export function UsernameLink({
  className,
  username,
}: Readonly<{
  className?: string;
  username: string | null | undefined;
}>) {
  const label = username?.trim() || "Jingdex";
  const isProfileUsername =
    /^[a-zA-Z0-9][a-zA-Z0-9_]{2,31}$/.test(label) &&
    label.toLocaleLowerCase() !== "jingdex";

  if (!isProfileUsername) {
    return <span className={className}>{label}</span>;
  }

  return (
    <Link
      className={
        className ??
        "font-bold text-foreground underline decoration-muted underline-offset-2 transition-colors hover:text-primary"
      }
      href={`/users/${encodeURIComponent(label)}`}
    >
      {label}
    </Link>
  );
}
