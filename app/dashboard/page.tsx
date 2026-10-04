import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { signOut } from "@/app/actions";
import { levelLabel } from "@/lib/levels";
import { getAccount } from "@/lib/profile";

export const metadata: Metadata = { title: "Tableau de bord" };

const modes = [
  { title: "Quiz rapide", body: "Dix questions pour t'échauffer." },
  { title: "Par matière", body: "Révise chapitre par chapitre." },
  { title: "Mode examen", body: "Les conditions du jour J, chronomètre compris." },
  { title: "Duels", body: "Défie un camarade sur une matière." },
];

export default async function Page() {
  const account = await getAccount();
  if (!account) redirect("/connexion");

  const firstName = account.name.split(" ")[0];

  return (
    <main className="flex-1">
      <section className="rounded-b-[2rem] bg-brand text-white sm:mx-4 sm:rounded-[2.5rem] lg:mx-6">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-9 sm:px-8 sm:py-12 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-display text-[clamp(2rem,9vw,3.5rem)] font-extrabold leading-[1.02] tracking-tight">
              Bienvenue, {firstName}.
            </h1>
            <dl className="mt-5 flex flex-wrap gap-2.5 text-sm">
              {account.level && (
                <div className="rounded-full bg-white/12 px-4 py-2 ring-1 ring-white/25">
                  <dt className="sr-only">Section</dt>
                  <dd className="font-semibold">{levelLabel(account.level)}</dd>
                </div>
              )}
              {account.department && (
                <div className="rounded-full bg-white/12 px-4 py-2 ring-1 ring-white/25">
                  <dt className="sr-only">Département</dt>
                  <dd className="font-semibold">{account.department}</dd>
                </div>
              )}
            </dl>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="h-12 rounded-xl bg-white px-5 font-bold text-brand hover:bg-brand-soft"
            >
              Se déconnecter
            </button>
          </form>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          Tes modes de révision
        </h2>
        <p className="mt-2 max-w-xl leading-relaxed text-ink/70">
          Ton compte est prêt. Les quiz arrivent sur le site dans la prochaine mise à jour.
        </p>
        <ul className="mt-7 grid gap-3 sm:grid-cols-2">
          {modes.map((mode) => (
            <li
              key={mode.title}
              className="flex items-center justify-between gap-4 rounded-3xl bg-brand-soft p-5 sm:p-6"
            >
              <div>
                <h3 className="font-display text-xl font-semibold">{mode.title}</h3>
                <p className="mt-1 text-ink/70">{mode.body}</p>
              </div>
              <span className="shrink-0 rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-ink/60">
                Bientôt
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-8 text-sm text-ink/60">Connecté avec {account.user.email}</p>
      </section>
    </main>
  );
}
