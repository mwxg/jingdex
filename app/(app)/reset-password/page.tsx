import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { JingdexLogo } from "@/components/jingdex-logo";
import { ResetPasswordForm } from "./reset-password-form";

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/login");
  }

  return (
    <main className="grid flex-1 place-items-center bg-background px-6 py-10 text-foreground">
      <div className="w-full max-w-md space-y-6">
        <JingdexLogo className="mx-auto h-20 w-auto" priority />

        <section className="space-y-6 rounded-lg border border-muted-background bg-surface p-6">
          <div className="space-y-2">
            <h1 className="font-heading text-4xl font-semibold text-foreground">
              Reset password
            </h1>
            <p className="font-sans text-sm leading-6 text-muted">
              Choose a new password for your Jingdex account.
            </p>
          </div>
          <ResetPasswordForm />
        </section>
      </div>
    </main>
  );
}
