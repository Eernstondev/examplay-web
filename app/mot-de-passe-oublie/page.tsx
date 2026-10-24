import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { ResetForm } from "@/components/reset-form";
import { getT } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Mot de passe oublié" };

export default async function Page() {
  const t = await getT();
  return (
    <AuthShell title={t("Mot de passe oublié")} lead={t("Entre ton e-mail : tu recevras un code pour choisir un nouveau mot de passe.")}>
      <div className="rounded-3xl bg-surface p-5 ring-1 ring-ink/10 sm:p-7">
        <ResetForm />
      </div>
      <p className="mt-6">
        <Link href="/connexion" className="font-medium text-brand-fg underline underline-offset-4">
          {t("Retour à la connexion")}
        </Link>
      </p>
    </AuthShell>
  );
}
