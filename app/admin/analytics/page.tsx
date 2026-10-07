import type { Metadata } from "next";
import { subjectName } from "@/lib/content";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Analytics" };

type Analytics = {
  retention_7d: number | null;
  top_subjects: { subject_id: string; subject_name: string; n: number }[];
  quiz_starts_30d: number;
  quiz_finishes_30d: number;
  dropout_pct_30d: number | null;
};

const card = "rounded-3xl bg-white p-5 ring-1 ring-ink/10";
const cardLabel = "text-sm font-semibold text-ink/60";
const cardValue = "mt-1.5 font-display text-3xl font-bold leading-tight";

export default async function Page() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("admin_analytics");
  const a = data as Analytics | null;

  if (!a) return <p className="text-ink/70">Les chiffres n&apos;ont pas pu être chargés.</p>;

  return (
    <>
      <h1 className="font-display text-3xl font-extrabold tracking-tight">Analytics</h1>
      <p className="mt-2 max-w-2xl text-ink/70">
        Rétention : part des élèves inscrits depuis plus de 7 jours qui ont joué dans les 7 derniers jours.
        Décrochage : part des quiz commencés (hors fiches) qui n&apos;ont pas été terminés dans les 30 derniers jours.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className={card}>
          <p className={cardLabel}>Rétention (7 jours)</p>
          <p className={cardValue}>{a.retention_7d === null ? "—" : `${a.retention_7d}%`}</p>
        </div>
        <div className={card}>
          <p className={cardLabel}>Quiz commencés (30 jours)</p>
          <p className={cardValue}>{a.quiz_starts_30d}</p>
        </div>
        <div className={card}>
          <p className={cardLabel}>Décrochage (30 jours)</p>
          <p className={cardValue}>{a.dropout_pct_30d === null ? "—" : `${a.dropout_pct_30d}%`}</p>
          <p className="mt-1 text-sm text-ink/60">{a.quiz_finishes_30d} terminés sur {a.quiz_starts_30d} commencés</p>
        </div>
      </div>

      <div className={`${card} mt-4`}>
        <p className={cardLabel}>Matières les plus jouées (30 jours)</p>
        {a.top_subjects.length === 0 ? (
          <p className="mt-3 text-ink/70">Pas encore assez de données.</p>
        ) : (
          <ol className="mt-3 grid gap-2">
            {a.top_subjects.map((s, i) => (
              <li key={s.subject_id} className="flex items-center justify-between gap-3 rounded-xl bg-brand-soft px-3 py-2">
                <span className="font-semibold">
                  {i + 1}. {s.subject_name || subjectName(s.subject_id)}
                </span>
                <span className="shrink-0 text-sm font-bold text-brand">{s.n} quiz</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </>
  );
}
