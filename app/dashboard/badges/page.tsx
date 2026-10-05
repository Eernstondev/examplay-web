import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProgressBar, SubHeader } from "@/components/app/ui";
import { computeBadges } from "@/lib/badges";
import { getSubjects } from "@/lib/content";
import { getAccount, getFinishedDuels, getReferralCount, getResults, getStreak } from "@/lib/data";

export const metadata: Metadata = { title: "Mes badges" };

export default async function Page() {
  const account = await getAccount();
  if (!account) redirect("/connexion");

  const [results, duels, streak, referrals] = await Promise.all([
    getResults(),
    getFinishedDuels(account.id),
    getStreak(),
    getReferralCount(),
  ]);
  const badges = computeBadges(results, duels, getSubjects(account.level), account.level, streak.streak, referrals);
  const earned = badges.filter((b) => b.done);
  const locked = badges.filter((b) => !b.done);

  return (
    <>
      <SubHeader title="Mes badges" />
      <p className="text-ink/70">
        <strong className="font-semibold text-ink">{earned.length}</strong> badge{earned.length > 1 ? "s" : ""} sur{" "}
        {badges.length}.
      </p>

      {earned.length > 0 && (
        <>
          <h2 className="mt-6 font-display text-xl font-bold">Obtenus</h2>
          <ul className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
            {earned.map((b) => (
              <li key={b.id} className="rounded-3xl bg-white p-4 text-center ring-1 ring-ink/10">
                <span aria-hidden="true" className="text-4xl">{b.emoji}</span>
                <p className="mt-2 font-display font-semibold leading-tight">{b.title}</p>
                <p className="mt-1 text-sm leading-snug text-ink/60">{b.desc}</p>
              </li>
            ))}
          </ul>
        </>
      )}

      <h2 className="mt-7 font-display text-xl font-bold">À débloquer</h2>
      <ul className="mt-3 grid gap-2.5 md:grid-cols-2">
        {locked.map((b) => (
          <li key={b.id} className="flex items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-ink/10">
            <span aria-hidden="true" className="text-3xl opacity-40 grayscale">{b.emoji}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-semibold leading-tight">{b.title}</p>
                <p className="shrink-0 text-sm tabular-nums text-ink/60">
                  {b.progress} / {b.goal}
                </p>
              </div>
              <p className="mt-0.5 text-sm leading-snug text-ink/60">{b.desc}</p>
              <div className="mt-2">
                <ProgressBar value={(b.progress / b.goal) * 100} />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
