import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignUpForm } from "@/components/auth-form";
import { AuthShell } from "@/components/auth-shell";
import { findLevel } from "@/lib/levels";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Inscription" };

export default async function Page({ searchParams }: PageProps<"/inscription">) {
  const { niveau } = await searchParams;
  const level = findLevel(typeof niveau === "string" ? niveau : undefined);
  if (!level) redirect("/commencer");

  const supabase = await createClient();
  const { data: session } = await supabase.auth.getClaims();
  if (session?.claims) redirect("/dashboard");

  return (
    <AuthShell
      title="Crée ton compte"
      lead={
        <>
          Section choisie : <strong className="text-ink">{level.label}</strong>.{" "}
          <Link href="/commencer" className="font-semibold text-brand underline underline-offset-4">
            Changer
          </Link>
        </>
      }
    >
      <div className="rounded-3xl bg-white p-5 ring-1 ring-ink/10 sm:p-7">
        <SignUpForm level={level.slug} />
      </div>
      <p className="mt-4 text-sm leading-relaxed text-ink/65">
        Ton niveau et ton département ne pourront plus être modifiés après l&apos;inscription.
      </p>
      <p className="mt-5 text-ink/75">
        Déjà un compte ?{" "}
        <Link
          href={`/connexion?niveau=${level.slug}`}
          className="font-semibold text-brand underline underline-offset-4"
        >
          Connecte-toi
        </Link>
      </p>
    </AuthShell>
  );
}
