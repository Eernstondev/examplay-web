import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdSlot } from "@/components/ad-slot";
import { ProgressBar, SubHeader } from "@/components/app/ui";
import { getSubjects } from "@/lib/content";
import { getAccount, getResults } from "@/lib/data";
import { globalProgress, haitiTime, pct, subjectProgress } from "@/lib/stats";

export const metadata: Metadata = { title: "Progression" };

const MODE_LABEL = { quiz: "Quiz", exam: "Simulation", short: "Réponse courte", essay: "Rédaction" };

export default async function Page() {
  const account = await getAccount();
  if (!account) redirect("/connexion");

  const results = await getResults();
  const subjects = getSubjects(account.level);
  const global = globalProgress(results, subjects);
  const totalCorrect = results.reduce((a, r) => a + r.correct, 0);
  const activeDays = new Set(results.map((r) => haitiTime(r.date).day)).size;
  const dateFormat = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "America/Port-au-Prince",
    day: "numeric",
    month: "short",
  });

  return (
    <>
      <SubHeader title="Progression" />
      <section className="rounded-3xl bg-brand p-6 text-white">
        <p className="text-sm font-semibold text-white/75">Progression globale</p>
        <p className="mt-1 font-display text-6xl font-extrabold leading-none">{global}%</p>
        <div className="mt-4">
          <ProgressBar value={global} tone="sun" />
        </div>
        <p className="mt-3 text-sm text-white/75">
          Moyenne de tes 5 derniers quiz par matière. Les matières ×2 comptent double.
        </p>
      </section>

      <dl className="mt-3 grid grid-cols-3 gap-3">
        {[
          ["Quiz terminés", results.length],
          ["Bonnes réponses", totalCorrect],
          ["Jours actifs", activeDays],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-surface p-4 ring-1 ring-ink/10">
            <dt className="text-xs font-semibold leading-tight text-ink/60 sm:text-sm">{label}</dt>
            <dd className="mt-1 font-display text-2xl font-bold">{value}</dd>
          </div>
        ))}
      </dl>

      <h2 className="mt-7 font-display text-xl font-bold">Par matière</h2>
      <ul className="mt-3 grid gap-2.5 md:grid-cols-2">
        {subjects.map((s) => {
          const count = results.filter((r) => r.subjectId === s.id).length;
          const progress = subjectProgress(results, s.id);
          return (
            <li key={s.id} className="rounded-2xl bg-surface p-4 ring-1 ring-ink/10">
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-semibold">
                  {s.name}
                  {s.heavy && <span className="ml-2 text-sm font-bold text-brand-fg">×2</span>}
                </p>
                <p className="shrink-0 text-sm font-semibold tabular-nums">{progress}%</p>
              </div>
              <div className="mt-2">
                <ProgressBar value={progress} />
              </div>
              <p className="mt-2 text-sm text-ink/60">
                {count ? `${count} quiz terminé${count > 1 ? "s" : ""}` : "Pas encore commencé"}
              </p>
            </li>
          );
        })}
      </ul>

      <h2 className="mt-7 font-display text-xl font-bold">Derniers résultats</h2>
      {results.length ? (
        <ul className="mt-3 grid gap-2.5">
          {results.slice(0, 10).map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 rounded-2xl bg-surface p-4 ring-1 ring-ink/10">
              <div className="min-w-0">
                <p className="truncate font-semibold">{r.subjectName}</p>
                <p className="text-sm text-ink/60">
                  {MODE_LABEL[r.mode] ?? r.mode} · {dateFormat.format(r.date)}
                </p>
              </div>
              <p className="shrink-0 font-display text-lg font-bold tabular-nums">
                {r.correct} / {r.total}
                <span className="ml-2 text-sm font-semibold text-ink/60">{pct(r)}%</span>
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-ink/70">
          Aucun résultat pour le moment.{" "}
          <Link href="/dashboard/matieres" className="font-semibold text-brand-fg underline underline-offset-4">
            Commence un quiz
          </Link>
        </p>
      )}

      <AdSlot
        placement="progression"
        target={{ department: account.department, level: account.level }}
        className="mt-7"
      />
    </>
  );
}
