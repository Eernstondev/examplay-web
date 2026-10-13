import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdSlot } from "@/components/ad-slot";
import { SubHeader } from "@/components/app/ui";
import { DEPARTMENTS, LEVELS } from "@/lib/content";
import Link from "next/link";
import { getAccount, getRanking, getWeeklyRanking } from "@/lib/data";
import { haitiToday } from "@/lib/revision-plan";
import { getT } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Classement" };

const ALL = "tous";
const LEVEL_OPTIONS = [
  { value: ALL, label: "Tous les niveaux" },
  { value: "9e", label: "9e année fondamentale" },
  { value: "ns4", label: "Tout le NS4" },
  ...LEVELS.filter((l) => l.id !== "9e").map((l) => ({ value: l.id, label: l.label })),
];

// Or : top 5 %, Argent : top 20 %, Bronze : top 50 % (sur au moins 100 places), comme dans l'app.
function medal(rank: number, total: number) {
  const p = rank / Math.max(total, 100);
  if (p <= 0.05) return { label: "Or", className: "bg-[#D4A017] text-white" };
  if (p <= 0.2) return { label: "Argent", className: "bg-[#94A3B8] text-white" };
  if (p <= 0.5) return { label: "Bronze", className: "bg-[#B45F2B] text-white" };
  return null;
}

// Jours restants avant la fin du défi (dimanche soir, heure d'Haïti).
function daysLeftInWeek() {
  const day = haitiToday().getDay(); // 0 = dimanche
  return day === 0 ? 0 : 7 - day;
}

const tab = "flex-1 rounded-xl px-4 py-2.5 text-center text-sm font-bold";

const select =
  "mt-1.5 h-12 w-full rounded-xl border border-ink/20 bg-surface px-3 text-base text-ink";

export default async function Page({ searchParams }: PageProps<"/dashboard/classement">) {
  const t = await getT();
  const account = await getAccount();
  if (!account) redirect("/connexion");

  const params = await searchParams;
  const rawDep = typeof params.dep === "string" ? params.dep : "";
  const rawLevel = typeof params.niv === "string" ? params.niv : "";

  // Par défaut : ton département et ton groupe de niveau (9e ou NS4).
  const dep = rawDep === ALL || DEPARTMENTS.includes(rawDep) ? rawDep : account.department;
  const level = LEVEL_OPTIONS.some((o) => o.value === rawLevel)
    ? rawLevel
    : account.level === "9e"
      ? "9e"
      : "ns4";

  const weekly = params.periode === "semaine";
  const depArg = dep === ALL ? null : dep;
  const levelArg = level === ALL ? null : level;
  const [board, lastWeek] = await Promise.all([
    weekly ? getWeeklyRanking(depArg, levelArg, 100, 0) : getRanking(depArg, levelArg, 100),
    weekly ? getWeeklyRanking(depArg, levelArg, 3, 1) : null,
  ]);
  const podium = (lastWeek?.rows ?? []).filter((r) => r.points > 0 && r.rank <= 3);
  const query = (periode: string) =>
    `/dashboard/classement?dep=${encodeURIComponent(dep)}&niv=${encodeURIComponent(level)}${periode ? `&periode=${periode}` : ""}`;
  const left = daysLeftInWeek();
  const levelLabel = t(LEVEL_OPTIONS.find((o) => o.value === level)?.label ?? "");
  const place = dep === ALL ? t("Tout Haïti") : dep;

  return (
    <>
      <SubHeader title={t("Classement")} />
      <nav className="flex gap-2 rounded-2xl bg-surface p-1.5 ring-1 ring-ink/10" aria-label={t("Période")}>
        <Link href={query("")} className={`${tab} ${weekly ? "text-ink/70" : "bg-brand text-white"}`}>
          {t("Général")}
        </Link>
        <Link href={query("semaine")} className={`${tab} ${weekly ? "bg-brand text-white" : "text-ink/70"}`}>
          {t("Défi de la semaine")}
        </Link>
      </nav>
      <p className="mt-4 text-ink/70">
        {weekly
          ? t("Points gagnés depuis lundi. Le défi repart à zéro chaque lundi") +
            (left ? t(" : encore {left} jour{s}.", { left, s: left > 1 ? "s" : "" }) : t(" : dernier jour !"))
          : t("10 points par bonne réponse, 30 par duel gagné.")}
      </p>

      {weekly && podium.length > 0 && (
        <section className="mt-5 rounded-3xl bg-navy p-5 text-white">
          <p className="text-sm font-semibold text-white/70">{t("Podium de la semaine dernière")}</p>
          <ol className="mt-3 grid grid-cols-3 gap-3 text-center">
            {podium.map((p) => (
              <li key={p.id} className="rounded-2xl bg-white/10 p-3">
                <p className="font-display text-2xl font-extrabold text-sun">{p.rank}</p>
                <p className="truncate font-semibold">{p.name}</p>
                <p className="text-sm text-white/70">{p.points}{t(" pts")}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      <form method="get" className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        {weekly && <input type="hidden" name="periode" value="semaine" />}
        <label className="block text-sm font-semibold">
          {t("Département")}
          <select name="dep" defaultValue={dep} className={select}>
            <option value={ALL}>{t("Tout Haïti")}</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-semibold">
          {t("Niveau")}
          <select name="niv" defaultValue={level} className={select}>
            {LEVEL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {t(o.label)}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="h-12 rounded-xl bg-brand px-6 text-base font-bold text-white hover:bg-brand-dark"
        >
          {t("Afficher")}
        </button>
      </form>

      <p className="mt-4 text-sm font-semibold text-ink/70">
        {place} · {levelLabel}
      </p>

      {board.me && (
        <section className="mt-3 flex items-center justify-between gap-4 rounded-3xl bg-brand p-5 text-white">
          <div>
            <p className="text-sm font-semibold text-white/75">{t("Ta place")}</p>
            <p className="font-display text-4xl font-extrabold leading-none">
              {board.me.rank}
              <span className="text-lg font-semibold text-white/70"> / {board.total}</span>
            </p>
          </div>
          <p className="font-display text-2xl font-bold">{board.me.points}{t(" pts")}</p>
        </section>
      )}

      {board.error ? (
        <p className="mt-8 text-center text-ink/70">{t("Le classement n'a pas pu être chargé.")}</p>
      ) : board.rows.length ? (
        <ol className="mt-5 grid gap-2">
          {board.rows.map((p) => {
            const m = medal(p.rank, board.total);
            return (
              <li
                key={p.id}
                className={`flex items-center gap-3 rounded-2xl p-3 ${
                  p.me ? "bg-surface ring-2 ring-brand" : "bg-surface ring-1 ring-ink/10"
                }`}
              >
                <span className="w-9 shrink-0 text-center font-display text-lg font-bold tabular-nums">{p.rank}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">
                    {p.name}
                    {p.me && <span className="ml-2 text-sm font-bold text-brand-fg">{t("Toi")}</span>}
                  </p>
                  {dep === ALL && <p className="truncate text-xs text-ink/60">{p.department}</p>}
                </div>
                {m && (
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${m.className}`}>{t(m.label)}</span>
                )}
                <span className="shrink-0 font-semibold tabular-nums">{p.points}{t(" pts")}</span>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="mt-8 text-center text-ink/70">{t("Personne dans ce classement pour le moment.")}</p>
      )}

      <AdSlot
        placement="classement"
        target={{ department: account.department, level: account.level }}
        className="mt-7"
      />
    </>
  );
}
