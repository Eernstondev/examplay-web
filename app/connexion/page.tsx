import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignInForm } from "@/components/auth-form";
import { AuthShell } from "@/components/auth-shell";
import { findLevel } from "@/lib/levels";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Connexion" };

export default async function Page({ searchParams }: PageProps<"/connexion">) {
  const t = await getT();
  const { niveau, erreur, reset } = await searchParams;
  const supabase = await createClient();
  const { data: session } = await supabase.auth.getClaims();
  if (session?.claims) redirect("/dashboard");

  const level = findLevel(typeof niveau === "string" ? niveau : undefined);
  const signUpHref = level ? `/inscription?niveau=${level.slug}` : "/commencer";

  return (
    <AuthShell
      title={t("Connexion")}
      lead={level ? t("Section choisie : {label}.", { label: level.label }) : t("Content de te revoir.")}
    >
      <div className="rounded-3xl bg-surface p-5 ring-1 ring-ink/10 sm:p-7">
        <SignInForm
          success={reset === "ok" ? t("Mot de passe modifié. Connecte-toi avec le nouveau.") : undefined}
          notice={
            erreur === "lien"
              ? t("Ce lien de confirmation n'est plus valide. Connecte-toi ou recrée ton compte.")
              : undefined
          }
        />
      </div>
      <p className="mt-6 text-ink/75">
        {t("Pas encore de compte ?")}{" "}
        <Link href={signUpHref} className="font-semibold text-brand-fg underline underline-offset-4">
          {t("Inscris-toi")}
        </Link>
      </p>
    </AuthShell>
  );
}
