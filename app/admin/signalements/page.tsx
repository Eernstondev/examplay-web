import type { Metadata } from "next";
import Link from "next/link";
import { setReportStatus } from "@/app/admin/actions";
import { ALL_SUBJECTS } from "@/lib/content";
import { REPORT_REASONS } from "@/lib/reports";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Signalements" };

type Joined<T> = T | T[] | null;
const first = <T,>(x: Joined<T>) => (Array.isArray(x) ? x[0] : x) ?? null;

export default async function Page({ searchParams }: PageProps<"/admin/signalements">) {
  const params = await searchParams;
  const status = params.status === "resolved" || params.status === "rejected" ? params.status : "open";

  const supabase = await createClient();
  const { data } = await supabase
    .from("question_reports")
    .select("id, reason, comment, created_at, question:questions(id, question, subject_id), reporter:profiles(name)")
    .eq("status", status)
    .order("created_at", { ascending: false })
    .limit(100);
  const rows = data ?? [];
  const date = new Intl.DateTimeFormat("fr-FR", { timeZone: "America/Port-au-Prince", dateStyle: "medium" });
  const filters = [
    { id: "open", label: "À traiter" },
    { id: "resolved", label: "Résolus" },
    { id: "rejected", label: "Rejetés" },
  ];

  return (
    <>
      <h1 className="font-display text-3xl font-extrabold tracking-tight">Signalements</h1>
      <nav aria-label="État" className="mt-5 flex gap-2">
        {filters.map((f) => (
          <Link
            key={f.id}
            href={`/admin/signalements?status=${f.id}`}
            aria-current={f.id === status ? "page" : undefined}
            className="grid h-11 place-items-center rounded-full bg-white px-4 text-sm font-bold text-ink/70 ring-1 ring-ink/10 aria-[current=page]:bg-brand aria-[current=page]:text-white"
          >
            {f.label}
          </Link>
        ))}
      </nav>

      {rows.length ? (
        <ul className="mt-5 grid gap-3">
          {rows.map((r) => {
            const question = first(r.question as Joined<{ id: string; question: string; subject_id: string }>);
            const reporter = first(r.reporter as Joined<{ name: string }>);
            return (
              <li key={r.id} className="rounded-3xl bg-white p-5 ring-1 ring-ink/10">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink/60">
                  <span className="rounded-full bg-danger-soft px-2.5 py-1 text-xs font-bold text-danger">
                    {REPORT_REASONS.find((x) => x.id === r.reason)?.label ?? r.reason}
                  </span>
                  <span>{ALL_SUBJECTS.find((s) => s.id === question?.subject_id)?.label}</span>
                  <span>
                    {reporter?.name ?? "Élève"} · {date.format(new Date(r.created_at))}
                  </span>
                </div>
                <p className="mt-2 font-semibold leading-snug">{question?.question}</p>
                {r.comment && <p className="mt-2 whitespace-pre-wrap rounded-xl bg-brand-soft px-3 py-2 text-sm">{r.comment}</p>}
                <div className="mt-3 flex flex-wrap gap-2">
                  {question && (
                    <Link href={`/admin/questions/${question.id}`} className="grid h-11 place-items-center rounded-xl bg-brand px-4 text-sm font-bold text-white">
                      Ouvrir la question
                    </Link>
                  )}
                  {(status === "open" ? ["resolved", "rejected"] : ["open"]).map((next) => (
                    <form key={next} action={setReportStatus}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="status" value={next} />
                      <button type="submit" className="h-11 rounded-xl px-4 text-sm font-bold ring-1 ring-ink/15">
                        {next === "resolved" ? "Marquer résolu" : next === "rejected" ? "Rejeter" : "Rouvrir"}
                      </button>
                    </form>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-8 text-center text-ink/70">Aucun signalement dans cette liste.</p>
      )}
    </>
  );
}
