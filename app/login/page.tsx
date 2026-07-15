import { createClient } from "@/lib/supabase/server";
import { getSafeNextPath } from "@/lib/auth/validation";
import { JingdexLogo } from "@/components/jingdex-logo";
import { AuthForm } from "./auth-form";

export default async function LoginPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ next?: string }>;
}>) {
  const resolvedSearchParams = await searchParams;
  const nextPath = getSafeNextPath(resolvedSearchParams.next ?? null);
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub ?? null;
  const { data: profile } = userId
    ? await supabase
        .from("profiles")
        .select("id")
        .eq("id", userId)
        .maybeSingle()
    : { data: null };
  const loginPrompt = nextPath.startsWith("/my-stuff/decks")
    ? "Log in to view your decks."
    : nextPath.startsWith("/my-stuff/contributions")
      ? "Log in to view your contributions."
      : nextPath.startsWith("/my-stuff")
        ? "Log in to view your stuff."
        : nextPath.startsWith("/dictionary/contribute")
          ? "Log in to contribute words."
          : nextPath.startsWith("/settings")
            ? "Log in to view your settings."
            : nextPath === "/"
              ? null
              : "Log in to view this page.";

  return (
    <main className="grid flex-1 place-items-center bg-background px-6 py-10 text-foreground">
      <div className="w-full max-w-md space-y-6">
        <JingdexLogo className="mx-auto h-20 w-auto" priority />

        <section className="rounded-lg border border-muted-background bg-surface p-6">
          <div className="mb-6 space-y-2 text-center">
            <h1 className="font-heading text-3xl font-semibold text-foreground">
              Log in or sign up
            </h1>
            {loginPrompt ? (
              <p className="font-sans text-sm leading-6 text-muted">
                {loginPrompt}
              </p>
            ) : null}
          </div>
          <AuthForm
            hasProfile={Boolean(profile)}
            isLoggedIn={Boolean(userId)}
            nextPath={nextPath}
          />
        </section>
      </div>
    </main>
  );
}
