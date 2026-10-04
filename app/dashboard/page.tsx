import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut } from "@/app/actions";
import { levelLabel } from "@/lib/levels";
import { getAccount } from "@/lib/profile";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Tableau de bord" };

const modes = [
  "Quiz rapide",
  "Par matière",
  "Mode examen",
  "Révision Smart",
  "Bibliothèque",
  "Communauté et duels",
];

const card = "rounded-3xl bg-white p-5 ring-1 ring-ink/10";
const cardTitle = "text-sm font-semibold text-ink/60";
const cardValue = "mt-1.5 font-display text-2xl font-bold leading-tight";

export default async function Page() {
  const account = await getAccount();
  if (!account) redirect("/connexion");

  const firstName = account.name.split(" ")[0];
  const level = levelLabel(account.level);
  const isNs4 = account.level?.toUpperCase().startsWith("NS4") ?? false;

  return (
    <div className="flex flex-1 flex-col bg-brand-soft">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="" width={40} height={40} priority className="rounded-[10px]" />
          <span className="font-display text-xl font-bold tracking-tight">{site.name}</span>
        </Link>
        <div className="flex items-center gap-2.5">
          <form action={signOut}>
            <button
              type="submit"
              className="min-h-11 rounded-lg px-3 text-sm font-semibold text-ink/70 hover:text-brand"
            >
              Se déconnecter
            </button>
          </form>
          <span
            aria-hidden="true"
            className="grid size-11 place-items-center rounded-full bg-brand font-display text-lg font-bold text-white"
          >
            {firstName.charAt(0).toUpperCase()}
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 pb-[calc(2.5rem+env(safe-area-inset-bottom))] sm:px-8">
        <h1 className="mt-3 font-display text-[clamp(1.75rem,7.5vw,2.75rem)] font-extrabold leading-[1.05] tracking-tight">
          Bienvenue, {firstName} !
        </h1>
        {level && (
          <p className="mt-2 text-ink/70">
            Série : <strong className="font-semibold text-ink">{level}</strong>
          </p>
        )}

        <section
          aria-label="Série de jours"
          className="mt-6 flex items-center gap-4 rounded-3xl bg-brand p-5 text-white sm:gap-6 sm:p-7"
        >
          <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-sun font-display text-3xl font-extrabold text-ink sm:size-20 sm:text-4xl">
            {account.streak}
          </span>
          <div>
            <h2 className="font-display text-xl font-bold leading-snug sm:text-2xl">
              {account.streak > 0
                ? `${account.streak} jour${account.streak > 1 ? "s" : ""} de suite`
                : "Commence une série aujourd'hui !"}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-white/80 sm:text-base">
              Continue ta série pour débloquer des badges.
            </p>
          </div>
        </section>

        <section aria-labelledby="modes" className="mt-7">
          <h2 id="modes" className="font-display text-xl font-bold tracking-tight">
            Réviser
          </h2>
          <p className="mt-1 text-sm text-ink/65">
            Les quiz arrivent sur le site dans la prochaine mise à jour.
          </p>
          <ul className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
            {modes.map((mode, i) => (
              <li
                key={mode}
                className={`flex min-h-28 flex-col justify-between gap-3 rounded-3xl p-4 sm:p-5 ${
                  i === 0 ? "bg-ink text-white" : "bg-white ring-1 ring-ink/10"
                }`}
              >
                <span
                  className={`self-start rounded-full px-2.5 py-1 text-xs font-semibold ${
                    i === 0 ? "bg-white/15 text-white" : "bg-brand-soft text-ink/60"
                  }`}
                >
                  Bientôt
                </span>
                <span className="font-display text-lg font-semibold leading-tight">{mode}</span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="stats" className="mt-7">
          <h2 id="stats" className="font-display text-xl font-bold tracking-tight">
            Ton parcours
          </h2>
          <dl className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
            <div className={card}>
              <dt className={cardTitle}>Points</dt>
              <dd className={cardValue}>{account.points} pts</dd>
            </div>
            <div className={card}>
              <dt className={cardTitle}>Ma série</dt>
              <dd className={cardValue}>
                {account.streak > 0 ? `${account.streak} jour${account.streak > 1 ? "s" : ""}` : "—"}
              </dd>
            </div>
            <div className={card}>
              <dt className={cardTitle}>Mes badges</dt>
              <dd className="mt-1.5 font-semibold">Aucun badge</dd>
            </div>
            <div className={card}>
              <dt className={cardTitle}>Progression</dt>
              <dd className="mt-1.5 font-semibold leading-snug">
                Commence un quiz pour progresser !
              </dd>
            </div>
            <div className={card}>
              <dt className={cardTitle}>Classement</dt>
              <dd className="mt-1.5 font-semibold leading-snug">
                Joue pour entrer dans le classement.
              </dd>
            </div>
            {isNs4 && (
              <div className={card}>
                <dt className={cardTitle}>Orientation</dt>
                <dd className="mt-1.5 font-semibold leading-snug">Ton avenir après le NS4</dd>
              </div>
            )}
          </dl>
        </section>
      </main>
    </div>
  );
}
