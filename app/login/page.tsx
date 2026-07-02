import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { getSafeNextPath } from "@/lib/auth/validation";
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

  return (
    <main className="flex-1 bg-background px-6 py-10 text-foreground">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[20rem_1fr] lg:items-start">
        <section className="space-y-5">
          <Image
            src="/logos/logo_square.svg"
            alt=""
            width={96}
            height={96}
            className="size-20"
            priority
          />
          <div>
            <p className="font-sans text-sm font-bold uppercase text-primary">
              Jingdex
            </p>
            <h1 className="mt-3 font-heading text-5xl font-semibold leading-none text-foreground sm:text-6xl">
              Sign in to study.
            </h1>
            <p className="mt-4 font-sans text-lg leading-8 text-muted">
              Access is closed while the deck system takes shape.
            </p>
          </div>
        </section>

        <section className="rounded-lg border border-muted-background bg-surface p-6">
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
