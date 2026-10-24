import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SubHeader } from "@/components/app/ui";
import { getSubjects } from "@/lib/content";
import { getAccount } from "@/lib/data";
import { buildPlan, haitiToday, type AttemptRow } from "@/lib/revision-plan";
import { createClient } from "@/lib/supabase/server";
import { getLang, getT } from "@/lib/i18n/server";
import { formatDate } from "@/lib/i18n/core";
import { CALENDRIER_OFFICIEL } from "@/lib/exam-dates";

export const metadata: Metadata = { title: "Plan de révision" };

// Réponses des 60 derniers jours (même table que l'app) pour repérer les chapitres faibles.
async function recentAttempts(): Promise<AttemptRow[]> {
  const supabase = await createClient();
  const since = new Date(Date.now() - 60 * 86400000).toISOString();
  const { data } = await supabase
    .from("attempts")
    .select("subject_id, chapter, correct")
    .gte("created_at", since)
    .limit(3000);
  return (data as AttemptRow[] | null) ?? [];
}


export default async function Page() {
  const tx = await getT();
  const lang = await getLang();
  const dayLabel = (d: Date) => formatDate(lang, d, { weekday: true });
  const account = await getAccount();
  if (!account) redirect("/connexion");

  const plan = buildPlan(account.level, getSubjects(account.level), await recentAttempts(), haitiToday());

  return (
    <>
      <SubHeader title={tx("Plan de révision")} />
      {!plan ? (
        <p className="mt-6 text-ink/70">{tx("Le calendrier des épreuves n'est pas encore disponible pour ton niveau.")}</p>
      ) : (
        <>
          <section className="rounded-3xl bg-brand p-6 text-white">
            <p className="text-sm font-semibold text-white/75">{tx("Première épreuve : ")}{plan.firstExam}</p>
            <p className="mt-1 text-6xl font-semibold leading-none">
              {plan.daysLeft}
              <span className="text-2xl font-semibold">{tx(" jour")}{plan.daysLeft > 1 ? tx("s") : ""}</span>
            </p>
            <p className="mt-3 text-sm text-white/80">
              {tx("Les épreuves proches et tes points faibles passent en premier. 2 séances de 30 min par jour.")}
            </p>
            {!CALENDRIER_OFFICIEL && (
              <p className="mt-2 text-xs text-white/65">{tx("Dates estimées d'après le calendrier 2026. Elles seront mises à jour dès la publication du MENFP.")}</p>
            )}
          </section>

          <ol className="mt-6 grid gap-5">
            {plan.days.map((day, i) => (
              <li key={day.date.toISOString()}>
                <h2 className="text-lg font-semibold first-letter:uppercase">
                  {i === 0 ? tx("Aujourd'hui") : i === 1 ? tx("Demain") : dayLabel(day.date)}
                  {i < 2 && <span className="font-normal text-ink/60"> · {dayLabel(day.date)}</span>}
                </h2>
                <ul className="mt-2 divide-y divide-ink/10 overflow-hidden rounded-2xl bg-surface ring-1 ring-ink/[0.06]">
                  {day.tasks.map((t, j) => {
                    const href = t.subject
                      ? `/dashboard/quiz?subject=${t.subject.id}&mode=quiz${t.chapter ? `&chapter=${encodeURIComponent(t.chapter)}` : ""}`
                      : null;
                    const body = (
                      <>
                        <span className="min-w-0 flex-1">
                          <span className="block font-semibold">{t.label}</span>
                          <span className="block text-sm text-ink/65">
                            {t.chapter ? tx("Chapitre à reprendre : {chapter}", { chapter: t.chapter }) : tx("Quiz de révision")}{tx(" · 30 min")}
                          </span>
                        </span>
                        {href && <span className="shrink-0 text-sm font-semibold text-brand-fg">{tx("Réviser")}</span>}
                      </>
                    );
                    return (
                      <li key={t.label + j}>
                        {href ? (
                          <Link href={href} className="flex items-center gap-3 p-4 hover:bg-brand-soft">
                            {body}
                          </Link>
                        ) : (
                          <div className="flex items-center gap-3 p-4">{body}</div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ol>
        </>
      )}
    </>
  );
}
