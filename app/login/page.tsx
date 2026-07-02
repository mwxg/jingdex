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
    <main className="grid flex-1 place-items-center bg-background px-6 py-10 text-foreground">
      <div className="w-full max-w-md space-y-6">
        <Image
          src="/logos/logo_rect.svg"
          alt="Jingdex"
          width={2176}
          height={1024}
          className="mx-auto h-20 w-auto"
          priority
        />

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
