import type { ReactNode } from "react";

type PageHeaderProps = Readonly<{
  description: ReactNode;
  eyebrow: ReactNode;
  eyebrowTone?: "primary" | "admin";
  title: ReactNode;
}>;

export function PageHeader({
  description,
  eyebrow,
  eyebrowTone = "primary",
  title,
}: PageHeaderProps) {
  return (
    <header className="space-y-3">
      <p
        className={`font-sans text-sm font-bold uppercase ${
          eyebrowTone === "admin" ? "text-admin" : "text-primary"
        }`}
      >
        {eyebrow}
      </p>
      <h1 className="font-heading text-5xl font-semibold leading-none text-foreground sm:text-6xl">
        {title}
      </h1>
      <p className="max-w-3xl font-heading text-2xl font-semibold leading-tight text-muted sm:text-3xl">
        {description}
      </p>
    </header>
  );
}
