import type { Metadata } from "next";
import Link from "next/link";
import { reviewSubmission } from "@/app/admin/actions";
import { ALL_SUBJECTS } from "@/lib/content";
import { QUESTION_TYPES } from "@/lib/question-types";
import { SUBMISSION_KINDS, SUBMISSION_STATUS } from "@/lib/reports";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Propositions" };

type Payload = {
  type?: string;
  question?: string;
  choices?: string[] | null;
  answer?: number | null;
  answer_text?: string | null;
  explain?: string | null;
  year?: number | null;
  session?: string | null;
  source?: string | null;
};
type Joined<T> = T | T[] | null;
const first = <T,>(x: Joined<T>) => (Array.isArray(x) ? x[0] : x) ?? null;

export default async function Page({ searchParams }: PageProps<"/admin/propositions">) {
  const params = await searchParams;
  const status = params.status === "approved" || params.status === "rejected" ? params.status : "pending";

  const supabase = await createClient();
  const { data } = await supabase
    .from("submissions")
    .select("id, kind, subject_id, question_id, payload, note, admin_note, created_at, author:profiles(name)")
    .neq("kind", "course")
    .eq("status", status)
    .order("created_at", { ascending: status === "pending" })
    .limit(50);
  const rows = data ?? [];
  const date = new Intl.DateTimeFormat("fr-FR", { timeZone: "America/Port-au-Prince", dateStyle: "medium" });

  return (
    <>
      <h1 className="font-display text-3xl font-extrabold tracking-tight">Propositions des contributeurs</h1>
      <nav aria-label="État" className="mt-5 flex gap-2">
        {(["pending", "approved", "rejected"] as const).map((s) => (
          <Link
            key={s}
            href={`/admin/propositions?status=${s}`}
            aria-current={s === status ? "page" : undefined}
            className="grid h-11 place-items-center rounded-full bg-white px-4 text-sm font-bold text-ink/70 ring-1 ring-ink/10 aria-[current=page]:bg-brand aria-[current=page]:text-white"
          >
            {SUBMISSION_STATUS[s].label}
          </Link>
        ))}
      </nav>

      {rows.length ? (
        <ul className="mt-5 grid gap-3">
          {rows.map((s) => {
            const p = s.payload as Payload;
            const author = first(s.author as Joined<{ name: string }>);
            return (
              <li key={s.id} className="rounded-3xl bg-white p-5 ring-1 ring-ink/10">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink/60">
                  <span className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-bold text-brand">
                    {SUBMISSION_KINDS[s.kind as keyof typeof SUBMISSION_KINDS]}
                  </span>
                  <span>{ALL_SUBJECTS.find((x) => x.id === s.subject_id)?.label ?? s.subject_id}</span>
                  <span>
                    {author?.name ?? "Contributeur"} · {date.format(new Date(s.created_at))}
                  </span>
                </div>

                <p className="mt-2 text-sm text-ink/60">
                  {QUESTION_TYPES.find((t) => t.id === p.type)?.label}
                  {p.year ? ` · ${p.year}` : ""}
                  {p.session ? ` · ${p.session}` : ""}
                  {p.source ? ` · ${p.source}` : ""}
                </p>
                <p className="mt-1 font-semibold leading-snug">{p.question}</p>
                {p.choices ? (
                  <ol className="mt-2 grid gap-1 text-sm">
                    {p.choices.map((c, i) => (
                      <li key={i} className={i === p.answer ? "font-bold text-success" : ""}>
                        {String.fromCharCode(65 + i)}. {c}
                        {i === p.answer && " (bonne réponse)"}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="mt-2 text-sm">
                    <strong>Réponse attendue :</strong> {p.answer_text}
                  </p>
                )}
                {p.explain && (
                  <p className="mt-2 text-sm text-ink/75">
                    <strong>Explication :</strong> {p.explain}
                  </p>
                )}
                {s.question_id && (
                  <Link
                    href={`/admin/questions/${s.question_id}`}
                    className="mt-2 inline-block text-sm font-semibold text-brand underline underline-offset-4"
                  >
                    Voir la question actuelle
                  </Link>
                )}

                {s.note && (
                  <p className="mt-3 rounded-xl bg-brand-soft px-3 py-2 text-sm">
                    <strong>Mot du contributeur :</strong> {s.note}
                  </p>
                )}
                {s.admin_note && (
                  <p className="mt-3 text-sm text-ink/70">
                    <strong>Ta réponse :</strong> {s.admin_note}
                  </p>
                )}

                {status === "pending" && (
                  <form action={reviewSubmission} className="mt-4 grid gap-3">
                    <input type="hidden" name="id" value={s.id} />
                    <label className="block text-sm font-semibold">
                      Réponse au contributeur (optionnel)
                      <input name="note" maxLength={500} className="mt-1.5 h-12 w-full rounded-xl border border-ink/20 bg-white px-3 text-base font-normal" />
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button type="submit" name="decision" value="approve" className="h-12 rounded-xl bg-success px-5 font-bold text-white">
                        {s.kind === "correction" ? "Approuver et corriger" : "Approuver et publier"}
                      </button>
                      <Link
                        href={`/admin/propositions/${s.id}`}
                        className="grid h-12 place-items-center rounded-xl bg-brand-soft px-5 font-bold text-brand"
                      >
                        Modifier avant d&apos;approuver
                      </Link>
                      <button type="submit" name="decision" value="reject" className="h-12 rounded-xl px-5 font-bold text-danger ring-1 ring-ink/15">
                        Refuser
                      </button>
                    </div>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-8 text-center text-ink/70">Aucune proposition dans cette liste.</p>
      )}
    </>
  );
}
