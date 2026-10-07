import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { ResetForm } from "@/components/reset-form";

export const metadata: Metadata = { title: "Mot de passe oublié" };

export default function Page() {
  return (
    <AuthShell title="Mot de passe oublié" lead="Entre ton e-mail : tu recevras un code pour choisir un nouveau mot de passe.">
      <div className="rounded-3xl bg-white p-5 ring-1 ring-ink/10 sm:p-7">
        <ResetForm />
      </div>
      <p className="mt-6">
        <Link href="/connexion" className="font-semibold text-brand underline underline-offset-4">
          Retour à la connexion
        </Link>
      </p>
    </AuthShell>
  );
}
