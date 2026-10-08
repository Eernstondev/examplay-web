import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { signOut } from "@/app/actions";
import { isAdmin, isContributor } from "@/lib/admin";
import { getAccount } from "@/lib/data";
import { ApplicationForm } from "@/components/contrib/application-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: { default: "Espace contributeurs", template: "%s | Contributeurs Examplay" },
  robots: { index: false, follow: false },
};

export default async function ContributorLayout({ children }: { children: ReactNode }) {
  const account = await getAccount();
  if (!account) redirect("/connexion");
  if (await isAdmin()) redirect("/admin/propositions");
  const allowed = await isContributor();
  let application: string | null = null;
  if (!allowed) {
    const supabase = await createClient();
    const { data } = await supabase.from("contributor_applications").select("status").maybeSingle();
    application = data?.status ?? null;
  }

  return (
    <div className="flex flex-1 flex-col bg-brand-soft">
      <header className="border-b border-ink/10 bg-surface">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
          <Link href="/contribuer" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="" width={36} height={36} priority className="rounded-[9px]" />
            <span className="font-display text-lg font-bold tracking-tight">Contributeurs</span>
          </Link>
          <div className="flex items-center gap-1">
            <Link href="/dashboard" className="grid min-h-11 place-items-center px-3 text-sm font-semibold text-ink/70 hover:text-brand-fg">
              Espace élève
            </Link>
            <form action={signOut}>
              <button type="submit" className="min-h-11 px-3 text-sm font-semibold text-ink/70 hover:text-brand-fg">
                Se déconnecter
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-7 sm:px-8">
        {allowed ? (
          children
        ) : (
          <div className="mx-auto max-w-xl rounded-3xl bg-surface p-6 ring-1 ring-ink/10 sm:p-8">
            <h1 className="font-display text-2xl font-extrabold tracking-tight">Espace enseignants et experts</h1>
            <p className="mt-3 leading-relaxed text-ink/75">
              Cet espace permet de proposer des questions et des corrections. Chaque proposition est
              relue par l&apos;équipe avant publication.
            </p>
            {application === "pending" ? (
              <p role="status" className="mt-4 rounded-xl bg-brand-soft px-4 py-3 font-semibold">
                Ta demande d&apos;accès est en cours d&apos;examen. Reviens sur cette page pour voir la réponse.
              </p>
            ) : application === "rejected" ? (
              <p className="mt-4 rounded-xl bg-danger-soft px-4 py-3 font-semibold text-danger-fg">
                Ta demande d&apos;accès n&apos;a pas été retenue.
              </p>
            ) : (
              <>
                <p className="mt-3 leading-relaxed text-ink/75">
                  Pour demander l&apos;accès, présente-toi en quelques lignes.
                </p>
                <ApplicationForm />
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
