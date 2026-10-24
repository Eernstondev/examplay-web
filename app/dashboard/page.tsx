import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AdSlot } from "@/components/ad-slot";
import { ProgressBar } from "@/components/app/ui";
import { computeBadges } from "@/lib/badges";
import { getSubjects, levelLabel } from "@/lib/content";
import {
  getAccount,
  getFinishedDuels,
  getLeaderboard,
  getReferralCount,
  getResults,
  getStreak,
  type Account,
} from "@/lib/data";
import { DAILY_GOAL, globalProgress, questionsToday } from "@/lib/stats";
import { getT } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Tableau de bord" };

const card = "block rounded-3xl bg-surface p-5 ring-1 ring-ink/[0.06] transition-transform active:scale-[0.98]";
const cardTitle = "text-sm font-semibold text-ink/60";
const cardValue = "mt-1.5 text-2xl font-semibold leading-tight";

const skeleton = "animate-pulse rounded-3xl";

const modes = [
  { title: "Quiz rapide", body: "5 questions sur ta matière à travailler", href: "/dashboard/quiz?mode=quiz" },
  { title: "Par matière", body: "Choisis ta matière et ton mode", href: "/dashboard/matieres" },
  { title: "Mode examen", body: "Simulation sans correction avant la fin", href: "/dashboard/matieres?mode=exam" },
  { title: "Révision Smart", body: "Fiches à retourner", href: "/dashboard/matieres?mode=flash" },
  { title: "Communauté et duels", body: "Élèves en ligne, défis, historique", href: "/dashboard/communaute" },
  { title: "Plan de révision", body: "Quoi réviser chaque jour jusqu'à l'examen", href: "/dashboard/plan" },
];

async function StreakCard() {
  const t = await getT();
  const [streak, results] = await Promise.all([getStreak(), getResults()]);
  const days = streak.streak;
  const done = questionsToday(results);
  const reached = done >= DAILY_GOAL;
  const atRisk = days > 0 && !streak.activeToday;
  return (
    <section aria-label={t("Série de jours")} className="mt-6 rounded-3xl bg-brand p-5 text-white sm:p-7">
      <div className="flex items-center gap-4 sm:gap-6">
        <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-sun text-3xl font-semibold text-sun-ink sm:size-20 sm:text-4xl">
          {days}
        </span>
        <div>
          <h2 className="text-xl font-semibold leading-snug sm:text-2xl">
            {days > 0 ? t("{days} jour{v1} de suite", { days, v1: days > 1 ? "s" : "" }) : t("Commence une série aujourd'hui !")}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-white/80 sm:text-base">
            {atRisk
              ? t("Ta série s'arrête ce soir : fais un quiz pour la garder.")
              : t("Continue ta série pour débloquer des badges.")}
          </p>
        </div>
      </div>
      <div className="mt-4">
        <div className="flex items-baseline justify-between text-sm font-semibold">
          <span>{reached ? t("Objectif du jour atteint") : t("Objectif du jour")}</span>
          <span className="tabular-nums text-white/85">
            {Math.min(done, DAILY_GOAL)} / {DAILY_GOAL}{t(" questions")}
          </span>
        </div>
        <div
          role="progressbar"
          aria-label={t("Objectif du jour")}
          aria-valuemin={0}
          aria-valuemax={DAILY_GOAL}
          aria-valuenow={Math.min(done, DAILY_GOAL)}
          className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/20"
        >
          <div className="h-full rounded-full bg-sun" style={{ width: `${Math.min(100, (done / DAILY_GOAL) * 100)}%` }} />
        </div>
      </div>
    </section>
  );
}

async function Stats({ account }: { account: Account }) {
  const t = await getT();
  const [results, duels, streak, board, referrals] = await Promise.all([
    getResults(),
    getFinishedDuels(account.id),
    getStreak(),
    getLeaderboard(1),
    getReferralCount(),
  ]);
  const subjects = getSubjects(account.level);
  const progress = globalProgress(results, subjects);
  const earned = computeBadges(results, duels, subjects, account.level, streak.streak, referrals).filter(
    (b) => b.done,
  );

  return (
    <ul className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
      <li>
        <Link href="/dashboard/classement" className={card}>
          <span className={cardTitle}>{t("Points")}</span>
          <span className={`${cardValue} block`}>{board.me?.points ?? 0}{t(" pts")}</span>
        </Link>
      </li>
      <li>
        <Link href="/dashboard/badges" className={card}>
          <span className={cardTitle}>{t("Mes badges")}</span>
          <span className={`${cardValue} block`}>
            {earned.length ? earned.length : t("Aucun badge")}
          </span>
          {earned.length > 0 && (
            <span aria-hidden="true" className="mt-1 block text-xl">
              {earned.slice(-4).map((b) => b.emoji).join(" ")}
            </span>
          )}
        </Link>
      </li>
      <li>
        <Link href="/dashboard/progression" className={card}>
          <span className={cardTitle}>{t("Progression")}</span>
          {results.length ? (
            <>
              <span className={`${cardValue} mb-2 block`}>{progress}%</span>
              <ProgressBar value={progress} />
            </>
          ) : (
            <span className="mt-1.5 block font-semibold leading-snug">
              {t("Commence un quiz pour progresser !")}
            </span>
          )}
        </Link>
      </li>
      <li>
        <Link href="/dashboard/classement" className={card}>
          <span className={cardTitle}>{t("Classement · ")}{account.department}</span>
          {board.me ? (
            <span className={`${cardValue} block`}>
              {board.me.rank}
              <span className="text-base font-semibold text-ink/60"> / {board.total}</span>
            </span>
          ) : (
            <span className="mt-1.5 block font-semibold leading-snug">{t("Voir le classement")}</span>
          )}
        </Link>
      </li>
      {account.level !== "9e" && (
        <li className="col-span-2 md:col-span-1">
          <Link href="/dashboard/orientation" className={card}>
            <span className={cardTitle}>{t("Orientation")}</span>
            <span className="mt-1.5 block font-semibold leading-snug">{t("Ton avenir après le NS4")}</span>
          </Link>
        </li>
      )}
    </ul>
  );
}

export default async function Page() {
  const t = await getT();
  const account = await getAccount();
  if (!account) redirect("/connexion");

  // L'en-tête et les boutons s'affichent tout de suite ; les données arrivent ensuite, en parallèle.
  return (
    <>
      <h1 className="mt-3 text-[clamp(1.75rem,5vw,2.5rem)] font-semibold leading-[1.1] tracking-[-0.03em]">
        {t("Bienvenue, ")}{account.name.split(" ")[0]} !
      </h1>
      <p className="mt-2 text-ink/70">
        {t("Série : ")}<strong className="font-semibold text-ink">{levelLabel(account.level)}</strong>
      </p>

      <Suspense fallback={<div className={`${skeleton} mt-6 h-[9.5rem] bg-brand/25 sm:h-[11rem]`} />}>
        <StreakCard />
      </Suspense>

      <section aria-labelledby="modes" className="mt-7">
        <h2 id="modes" className="text-xl font-semibold tracking-tight">
          {t("Réviser")}
        </h2>
        <ul className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
          {modes.map((mode, i) => (
            <li key={mode.title} className={i === 0 ? "col-span-2 md:col-span-1" : ""}>
              <Link
                href={mode.href}
                className={`flex h-full min-h-28 flex-col justify-between gap-3 rounded-3xl p-4 transition-transform active:scale-[0.98] sm:p-5 ${
                  i === 0 ? "bg-brand text-white" : "bg-surface ring-1 ring-ink/[0.06]"
                }`}
              >
                <span className="text-lg font-semibold leading-tight">{t(mode.title)}</span>
                <span className={`text-sm leading-snug ${i === 0 ? "text-white/75" : "text-ink/60"}`}>
                  {t(mode.body)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <Suspense fallback={null}>
        <AdSlot
          placement="dashboard"
          target={{ department: account.department, level: account.level }}
          className="mt-7"
        />
      </Suspense>

      <section aria-labelledby="stats" className="mt-7">
        <h2 id="stats" className="text-xl font-semibold tracking-tight">
          {t("Ton parcours")}
        </h2>
        <Suspense
          fallback={
            <ul aria-hidden="true" className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
              {[0, 1, 2, 3].map((i) => (
                <li key={i} className={`${skeleton} h-24 bg-surface/70`} />
              ))}
            </ul>
          }
        >
          <Stats account={account} />
        </Suspense>
      </section>
    </>
  );
}
