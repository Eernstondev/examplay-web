import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ProgressBar } from "@/components/app/ui";
import { computeBadges } from "@/lib/badges";
import { getSubjects, levelLabel } from "@/lib/content";
import {
  getAccount,
  getFinishedDuels,
  getLeaderboard,
  getQuestionCounts,
  getReferralCount,
  getResults,
  getStreak,
} from "@/lib/data";
import { globalProgress, subjectProgress } from "@/lib/stats";

export const metadata: Metadata = { title: "Tableau de bord" };

const card = "block rounded-3xl bg-white p-5 ring-1 ring-ink/10 transition-transform active:scale-[0.98]";
const cardTitle = "text-sm font-semibold text-ink/60";
const cardValue = "mt-1.5 font-display text-2xl font-bold leading-tight";

export default async function Page() {
  const account = await getAccount();
  if (!account) redirect("/connexion");

  const [results, duels, streak, board, counts, referrals] = await Promise.all([
    getResults(),
    getFinishedDuels(account.id),
    getStreak(),
    getLeaderboard(1),
    getQuestionCounts(),
    getReferralCount(),
  ]);

  const subjects = getSubjects(account.level);
  const progress = globalProgress(results, subjects);
  const earned = computeBadges(results, duels, subjects, account.level, streak.streak, referrals).filter(
    (b) => b.done,
  );
  // Quiz rapide : la matière disponible où l'élève est le moins avancé (coefficient ×2 d'abord).
  const reco = subjects
    .filter((s) => (counts[s.id] ?? 0) > 0)
    .map((s) => ({ s, p: subjectProgress(results, s.id) }))
    .sort((a, b) => a.p - b.p || Number(b.s.heavy) - Number(a.s.heavy))[0]?.s;

  const modes = [
    {
      title: "Quiz rapide",
      body: reco ? `5 questions · ${reco.name}` : "5 questions à choix multiples",
      href: reco ? `/dashboard/quiz?subject=${reco.id}&mode=quiz` : "/dashboard/matieres?mode=quiz",
    },
    { title: "Par matière", body: "Choisis ta matière et ton mode", href: "/dashboard/matieres" },
    { title: "Mode examen", body: "Simulation sans correction avant la fin", href: "/dashboard/matieres?mode=exam" },
    { title: "Révision Smart", body: "Fiches à retourner", href: "/dashboard/matieres?mode=flash" },
    { title: "Communauté et duels", body: "Élèves en ligne, défis, historique", href: "/dashboard/communaute" },
  ];

  const firstName = account.name.split(" ")[0];
  const days = streak.streak;

  return (
    <>
      <h1 className="mt-3 font-display text-[clamp(1.75rem,7.5vw,2.75rem)] font-extrabold leading-[1.05] tracking-tight">
        Bienvenue, {firstName} !
      </h1>
      <p className="mt-2 text-ink/70">
        Série : <strong className="font-semibold text-ink">{levelLabel(account.level)}</strong>
      </p>

      <section
        aria-label="Série de jours"
        className="mt-6 flex items-center gap-4 rounded-3xl bg-brand p-5 text-white sm:gap-6 sm:p-7"
      >
        <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-sun font-display text-3xl font-extrabold text-ink sm:size-20 sm:text-4xl">
          {days}
        </span>
        <div>
          <h2 className="font-display text-xl font-bold leading-snug sm:text-2xl">
            {days > 0 ? `${days} jour${days > 1 ? "s" : ""} de suite` : "Commence une série aujourd'hui !"}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-white/80 sm:text-base">
            {days > 0 && !streak.activeToday
              ? "Fais un quiz aujourd'hui pour garder ta série."
              : "Continue ta série pour débloquer des badges."}
          </p>
        </div>
      </section>

      <section aria-labelledby="modes" className="mt-7">
        <h2 id="modes" className="font-display text-xl font-bold tracking-tight">
          Réviser
        </h2>
        <ul className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
          {modes.map((mode, i) => (
            <li key={mode.title} className={i === 0 ? "col-span-2 md:col-span-1" : ""}>
              <Link
                href={mode.href}
                className={`flex h-full min-h-28 flex-col justify-between gap-3 rounded-3xl p-4 transition-transform active:scale-[0.98] sm:p-5 ${
                  i === 0 ? "bg-ink text-white" : "bg-white ring-1 ring-ink/10"
                }`}
              >
                <span className="font-display text-lg font-semibold leading-tight">{mode.title}</span>
                <span className={`text-sm leading-snug ${i === 0 ? "text-white/75" : "text-ink/60"}`}>
                  {mode.body}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="stats" className="mt-7">
        <h2 id="stats" className="font-display text-xl font-bold tracking-tight">
          Ton parcours
        </h2>
        <ul className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
          <li>
            <Link href="/dashboard/classement" className={card}>
              <span className={cardTitle}>Points</span>
              <span className={`${cardValue} block`}>{board.me?.points ?? 0} pts</span>
            </Link>
          </li>
          <li>
            <Link href="/dashboard/badges" className={card}>
              <span className={cardTitle}>Mes badges</span>
              <span className={`${cardValue} block`}>
                {earned.length ? earned.length : "Aucun badge"}
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
              <span className={cardTitle}>Progression</span>
              {results.length ? (
                <>
                  <span className={`${cardValue} mb-2 block`}>{progress}%</span>
                  <ProgressBar value={progress} />
                </>
              ) : (
                <span className="mt-1.5 block font-semibold leading-snug">
                  Commence un quiz pour progresser !
                </span>
              )}
            </Link>
          </li>
          <li>
            <Link href="/dashboard/classement" className={card}>
              <span className={cardTitle}>Classement · {account.department}</span>
              {board.me ? (
                <span className={`${cardValue} block`}>
                  {board.me.rank}
                  <span className="text-base font-semibold text-ink/60"> / {board.total}</span>
                </span>
              ) : (
                <span className="mt-1.5 block font-semibold leading-snug">Voir le classement</span>
              )}
            </Link>
          </li>
          {account.level !== "9e" && (
            <li className="col-span-2 md:col-span-1">
              <Link href="/dashboard/orientation" className={card}>
                <span className={cardTitle}>Orientation</span>
                <span className="mt-1.5 block font-semibold leading-snug">Ton avenir après le NS4</span>
              </Link>
            </li>
          )}
        </ul>
      </section>
    </>
  );
}
