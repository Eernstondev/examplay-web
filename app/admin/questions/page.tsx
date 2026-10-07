import type { Metadata } from "next";
import Link from "next/link";
import { setQuestionActive } from "@/app/admin/actions";
import { QUESTION_TYPES } from "@/lib/question-types";
import { ALL_SUBJECTS } from "@/lib/content";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Questions" };

const PAGE_SIZE = 30;
const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");
const field = "mt-1.5 h-12 w-full rounded-xl border border-ink/20 bg-white px-3 text-base font-normal";

export default async function Page({ searchParams }: PageProps<"/admin/questions">) {
  const params = await searchParams;
  const subject = ALL_SUBJECTS.find((s) => s.id === one(params.subject)) ?? ALL_SUBJECTS[0];
  const type = QUESTION_TYPES.find((t) => t.id === one(params.type))?.id ?? "";
  const status = one(params.status);
  const search = one(params.q).trim();
  const page = Math.max(1, Number(one(params.page)) || 1);

  const supabase = await createClient();
  let query = supabase
    .from("questions")
    .select("id, type, question, active", { count: "exact" })
    .eq("subject_id", subject.id);
  if (type) query = query.eq("type", type);
  if (status === "active") query = query.eq("active", true);
  if (status === "inactive") query = query.eq("active", false);
  // Les caractères spéciaux de LIKE sont neutralisés pour chercher le texte tel quel.
  if (search) query = query.ilike("question", `%${search.replace(/[%_\\]/g, "\\$&")}%`);
  const { data, count } = await query
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  const total = count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const link = (p: number) =>
    `/admin/questions?${new URLSearchParams({ subject: subject.id, type, status, q: search, page: String(p) })}`;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Questions</h1>
        <Link
          href={`/admin/questions/nouvelle?subject=${subject.id}`}
          className="grid h-12 place-items-center rounded-xl bg-brand px-5 font-bold text-white hover:bg-brand-dark"
        >
          Nouvelle question
        </Link>
      </div>

      <form className="mt-5 grid gap-3 rounded-3xl bg-white p-4 ring-1 ring-ink/10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.4fr_auto] lg:items-end">
        <label className="block text-sm font-semibold">
          Matière
          <select name="subject" defaultValue={subject.id} className={field}>
            {ALL_SUBJECTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-semibold">
          Type
          <select name="type" defaultValue={type} className={field}>
            <option value="">Tous</option>
            {QUESTION_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-semibold">
          État
          <select name="status" defaultValue={status} className={field}>
            <option value="">Toutes</option>
            <option value="active">Actives</option>
            <option value="inactive">Désactivées</option>
          </select>
        </label>
        <label className="block text-sm font-semibold">
          Rechercher dans l&apos;énoncé
          <input type="search" name="q" defaultValue={search} className={field} />
        </label>
        <button type="submit" className="h-12 rounded-xl bg-ink px-5 font-bold text-white">
          Filtrer
        </button>
      </form>

      <p className="mt-4 text-sm text-ink/70">
        {total} question{total > 1 ? "s" : ""} · {subject.label}
      </p>

      {data?.length ? (
        <ul className="mt-3 grid gap-2">
          {data.map((q) => (
            <li key={q.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-ink/10">
              <div className="min-w-0 flex-1 basis-64">
                <p className={`line-clamp-2 font-semibold leading-snug ${q.active ? "" : "text-ink/45"}`}>
                  {q.question}
                </p>
                <p className="mt-1 text-sm text-ink/60">
                  {QUESTION_TYPES.find((t) => t.id === q.type)?.label ?? q.type}
                  {!q.active && " · Désactivée"}
                </p>
              </div>
              <form action={setQuestionActive}>
                <input type="hidden" name="id" value={q.id} />
                <input type="hidden" name="active" value={String(!q.active)} />
                <button type="submit" className="h-11 rounded-xl px-4 text-sm font-bold text-ink/70 ring-1 ring-ink/15">
                  {q.active ? "Désactiver" : "Réactiver"}
                </button>
              </form>
              <Link
                href={`/admin/questions/${q.id}`}
                className="grid h-11 place-items-center rounded-xl bg-brand-soft px-4 text-sm font-bold text-brand"
              >
                Modifier
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-8 text-center text-ink/70">Aucune question ne correspond à ces filtres.</p>
      )}

      {pages > 1 && (
        <nav aria-label="Pagination" className="mt-5 flex items-center justify-between gap-3">
          {page > 1 ? (
            <Link href={link(page - 1)} className="grid h-11 place-items-center rounded-xl bg-white px-4 text-sm font-bold ring-1 ring-ink/15">
              Précédent
            </Link>
          ) : (
            <span />
          )}
          <span className="text-sm text-ink/70">
            Page {page} sur {pages}
          </span>
          {page < pages ? (
            <Link href={link(page + 1)} className="grid h-11 place-items-center rounded-xl bg-white px-4 text-sm font-bold ring-1 ring-ink/15">
              Suivant
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </>
  );
}
