import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Choisis ta section" };

const tile =
  "flex min-h-40 flex-col justify-between gap-6 rounded-3xl p-6 transition-transform active:scale-[0.98] sm:min-h-52 sm:p-8";

export default async function Page() {
  const supabase = await createClient();
  const { data: session } = await supabase.auth.getClaims();
  if (session?.claims) redirect("/dashboard");

  return (
    <AuthShell wide title="Choisis ta section" lead="Quel examen prépares-tu cette année ?">
      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/connexion?niveau=9e" className={`${tile} bg-navy text-white`}>
          <span className="font-display text-4xl font-extrabold">9e AF</span>
          <span className="text-white/75">9e année fondamentale</span>
        </Link>
        <Link href="/commencer/ns4" className={`${tile} bg-brand text-white`}>
          <span className="font-display text-4xl font-extrabold">NS4</span>
          <span className="text-white/80">Nouveau Secondaire 4 : tu choisis ta série ensuite</span>
        </Link>
      </div>
      <p className="mt-7 text-ink/75">
        Déjà un compte ?{" "}
        <Link href="/connexion" className="font-semibold text-brand-fg underline underline-offset-4">
          Connecte-toi
        </Link>
      </p>
    </AuthShell>
  );
}
