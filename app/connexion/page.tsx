import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignInForm } from "@/components/auth-form";
import { AuthShell } from "@/components/auth-shell";
import { findLevel } from "@/lib/levels";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Connexion" };

export default async function Page({ searchParams }: PageProps<"/connexion">) {
  const { niveau, erreur, reset } = await searchParams;
  const supabase = await createClient();
  const { data: session } = await supabase.auth.getClaims();
  if (session?.claims) redirect("/dashboard");

  const level = findLevel(typeof niveau === "string" ? niveau : undefined);
  const signUpHref = level ? `/inscription?niveau=${level.slug}` : "/commencer";

  return (
    <AuthShell
      title="Connexion"
      lead={level ? `Section choisie : ${level.label}.` : "Content de te revoir."}
    >
      <div className="rounded-3xl bg-surface p-5 ring-1 ring-ink/10 sm:p-7">
        <SignInForm
          success={reset === "ok" ? "Mot de passe modifié. Connecte-toi avec le nouveau." : undefined}
          notice={
            erreur === "lien"
              ? "Ce lien de confirmation n'est plus valide. Connecte-toi ou recrée ton compte."
              : undefined
          }
        />
      </div>
      <p className="mt-6 text-ink/75">
        Pas encore de compte ?{" "}
        <Link href={signUpHref} className="font-semibold text-brand-fg underline underline-offset-4">
          Inscris-toi
        </Link>
      </p>
    </AuthShell>
  );
}
