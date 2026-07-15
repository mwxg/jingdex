import Link from "next/link";

export function LoginRequired({
  description,
  nextPath,
  title,
}: Readonly<{
  description: string;
  nextPath: string;
  title: string;
}>) {
  return (
    <section className="rounded-lg border border-muted-background bg-surface p-6">
      <h2 className="font-heading text-2xl font-semibold text-foreground">
        {title}
      </h2>
      <p className="mt-2 max-w-2xl font-sans leading-7 text-muted">
        {description}
      </p>
      <Link
        className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-primary px-5 font-sans text-sm font-bold text-on-primary transition-colors hover:bg-primary/90"
        href={`/login?next=${encodeURIComponent(nextPath)}`}
      >
        Log in/Sign up
      </Link>
    </section>
  );
}
