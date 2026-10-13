import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SubHeader } from "@/components/app/ui";
import { getSubjects } from "@/lib/content";
import { getAccount } from "@/lib/data";
import { buildPlan, haitiToday, type AttemptRow } from "@/lib/revision-plan";
import { createClient } from "@/lib/supabase/server";

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

const dayLabel = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "short" });

export default async function Page() {
  const account = await getAccount();
  if (!account) redirect("/connexion");

  const plan = buildPlan(account.level, getSubjects(account.level), await recentAttempts(), haitiToday());

  return (
    <>
      <SubHeader title="Plan de révision" />
      {!plan ? (
        <p className="mt-6 text-ink/70">Le calendrier des épreuves n&apos;est pas encore disponible pour ton niveau.</p>
      ) : (
        <>
          <section className="rounded-3xl bg-brand p-6 text-white">
            <p className="text-sm font-semibold text-white/75">Première épreuve : {plan.firstExam}</p>
            <p className="mt-1 font-display text-6xl font-extrabold leading-none">
              {plan.daysLeft}
              <span className="text-2xl font-bold"> jour{plan.daysLeft > 1 ? "s" : ""}</span>
            </p>
            <p className="mt-3 text-sm text-white/80">
              Les épreuves proches et tes points faibles passent en premier. 2 séances de 30 min par jour.
            </p>
          </section>

          <ol className="mt-6 grid gap-5">
            {plan.days.map((day, i) => (
              <li key={day.date.toISOString()}>
                <h2 className="font-display text-lg font-bold first-letter:uppercase">
                  {i === 0 ? "Aujourd'hui" : i === 1 ? "Demain" : dayLabel.format(day.date)}
                  {i < 2 && <span className="font-normal text-ink/60"> · {dayLabel.format(day.date)}</span>}
                </h2>
                <ul className="mt-2 divide-y divide-ink/10 overflow-hidden rounded-2xl bg-surface ring-1 ring-ink/10">
                  {day.tasks.map((t, j) => {
                    const href = t.subject
                      ? `/dashboard/quiz?subject=${t.subject.id}&mode=quiz${t.chapter ? `&chapter=${encodeURIComponent(t.chapter)}` : ""}`
                      : null;
                    const body = (
                      <>
                        <span className="min-w-0 flex-1">
                          <span className="block font-semibold">{t.label}</span>
                          <span className="block text-sm text-ink/65">
                            {t.chapter ? `Chapitre à reprendre : ${t.chapter}` : "Quiz de révision"} · 30 min
                          </span>
                        </span>
                        {href && <span className="shrink-0 text-sm font-bold text-brand-fg">Réviser</span>}
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
