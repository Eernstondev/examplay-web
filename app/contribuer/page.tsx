import type { Metadata } from "next";
import Link from "next/link";
import { withdrawSubmission } from "@/app/contribuer/actions";
import { ALL_SUBJECTS } from "@/lib/content";
import { SUBMISSION_KINDS, SUBMISSION_STATUS } from "@/lib/reports";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Mes propositions" };

const actions = [
  { href: "/contribuer/question", title: "Proposer une question", body: "QCM, réponse courte ou rédaction, y compris tirée d'un examen passé." },
  { href: "/contribuer/correction", title: "Corriger une question", body: "Une erreur dans une question existante ? Propose la version corrigée." },
  { href: "/contribuer/cours", title: "Proposer un cours", body: "Un résumé de chapitre ou une fiche de révision." },
];

export default async function Page({ searchParams }: PageProps<"/contribuer">) {
  const { envoi } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase
    .from("submissions")
    .select("id, kind, status, subject_id, payload, admin_note, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  const rows = data ?? [];
  const date = new Intl.DateTimeFormat("fr-FR", { timeZone: "America/Port-au-Prince", dateStyle: "medium" });

  return (
    <>
      <h1 className="font-display text-3xl font-extrabold tracking-tight">Espace contributeurs</h1>
      <p className="mt-2 max-w-2xl leading-relaxed text-ink/70">
        Tout ce que tu proposes est relu par l&apos;équipe Examplay avant d&apos;être publié auprès des élèves.
      </p>
      {envoi === "ok" && (
        <p role="status" className="mt-4 rounded-xl bg-success-soft px-4 py-3 text-sm font-semibold text-success">
          Proposition envoyée. Tu seras fixé dès qu&apos;elle aura été relue.
        </p>
      )}

      <ul className="mt-6 grid gap-3 md:grid-cols-3">
        {actions.map((a) => (
          <li key={a.href}>
            <Link href={a.href} className="flex h-full flex-col rounded-3xl bg-white p-5 ring-1 ring-ink/10 transition-transform hover:ring-2 hover:ring-brand active:scale-[0.98]">
              <span className="font-display text-lg font-semibold">{a.title}</span>
              <span className="mt-1.5 text-sm leading-relaxed text-ink/65">{a.body}</span>
            </Link>
          </li>
        ))}
      </ul>

      <h2 className="mt-8 font-display text-xl font-bold">Mes propositions ({rows.length})</h2>
      {rows.length ? (
        <ul className="mt-3 grid gap-2.5">
          {rows.map((s) => {
            const payload = s.payload as { question?: string; title?: string };
            const status = SUBMISSION_STATUS[s.status as keyof typeof SUBMISSION_STATUS];
            return (
              <li key={s.id} className="rounded-2xl bg-white p-4 ring-1 ring-ink/10">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink/60">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${status.className}`}>{status.label}</span>
                  <span className="font-semibold">{SUBMISSION_KINDS[s.kind as keyof typeof SUBMISSION_KINDS]}</span>
                  <span>{ALL_SUBJECTS.find((x) => x.id === s.subject_id)?.label ?? s.subject_id}</span>
                  <span>{date.format(new Date(s.created_at))}</span>
                </div>
                <p className="mt-2 line-clamp-2 font-semibold leading-snug">{payload.question ?? payload.title}</p>
                {s.admin_note && (
                  <p className="mt-2 rounded-xl bg-brand-soft px-3 py-2 text-sm leading-relaxed">
                    <strong>Réponse de l&apos;équipe :</strong> {s.admin_note}
                  </p>
                )}
                {s.status === "pending" && (
                  <form action={withdrawSubmission} className="mt-2">
                    <input type="hidden" name="id" value={s.id} />
                    <button type="submit" className="min-h-11 text-sm font-semibold text-danger underline underline-offset-4">
                      Retirer cette proposition
                    </button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-3 text-ink/70">Tu n&apos;as encore rien proposé.</p>
      )}
    </>
  );
}
