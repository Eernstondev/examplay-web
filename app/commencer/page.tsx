import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Choisis ta section" };

const tile =
  "flex min-h-36 flex-col justify-between gap-6 rounded-3xl bg-ink/[0.035] p-6 ring-1 ring-transparent transition hover:ring-brand/40 active:scale-[0.98] sm:min-h-44 sm:p-8";

export default async function Page() {
  const t = await getT();
  const supabase = await createClient();
  const { data: session } = await supabase.auth.getClaims();
  if (session?.claims) redirect("/dashboard");

  return (
    <AuthShell wide title={t("Choisis ta section")} lead={t("Quel examen prépares-tu cette année ?")}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/connexion?niveau=9e" className={tile}>
          <span className="text-3xl font-semibold tracking-tight">{t("9e AF")}</span>
          <span className="text-ink/60">{t("9e année fondamentale")}</span>
        </Link>
        <Link href="/commencer/ns4" className={tile}>
          <span className="text-3xl font-semibold tracking-tight">{t("NS4")}</span>
          <span className="text-ink/60">{t("Nouveau Secondaire 4 : tu choisis ta série ensuite")}</span>
        </Link>
      </div>
      <p className="mt-7 text-ink/75">
        {t("Déjà un compte ?")}{" "}
        <Link href="/connexion" className="font-medium text-brand-fg underline underline-offset-4">
          {t("Connecte-toi")}
        </Link>
      </p>
    </AuthShell>
  );
}
