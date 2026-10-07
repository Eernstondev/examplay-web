import type { Metadata } from "next";
import { addChapter, deleteChapter, updateChapter } from "@/app/admin/actions";
import { ALL_SUBJECTS } from "@/lib/content";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Chapitres" };

const field = "h-12 w-full rounded-xl border border-ink/20 bg-white px-3 text-base";

export default async function Page({ searchParams }: PageProps<"/admin/chapitres">) {
  const params = await searchParams;
  const subject = ALL_SUBJECTS.find((s) => s.id === params.subject) ?? ALL_SUBJECTS[0];

  const supabase = await createClient();
  const [{ data: chapters }, { data: questions }] = await Promise.all([
    supabase.from("chapters").select("id, title, order_index").eq("subject_id", subject.id).order("order_index"),
    supabase.from("questions").select("chapter_id").eq("subject_id", subject.id).not("chapter_id", "is", null),
  ]);
  const counts = new Map<string, number>();
  (questions ?? []).forEach((q) => counts.set(q.chapter_id, (counts.get(q.chapter_id) ?? 0) + 1));

  return (
    <>
      <h1 className="font-display text-3xl font-extrabold tracking-tight">Chapitres</h1>

      <form className="mt-5 flex flex-wrap items-end gap-3 rounded-3xl bg-white p-4 ring-1 ring-ink/10">
        <label className="block min-w-56 flex-1 text-sm font-semibold">
          Matière
          <select name="subject" defaultValue={subject.id} className={`${field} mt-1.5 font-normal`}>
            {ALL_SUBJECTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="h-12 rounded-xl bg-ink px-5 font-bold text-white">
          Afficher
        </button>
      </form>

      <h2 className="mt-7 font-display text-xl font-bold">{subject.label}</h2>
      {chapters?.length ? (
        <ul className="mt-3 grid gap-2">
          {chapters.map((c) => {
            const count = counts.get(c.id) ?? 0;
            return (
              <li key={c.id} className="flex flex-wrap items-end gap-2 rounded-2xl bg-white p-3 ring-1 ring-ink/10">
                <form action={updateChapter} className="flex min-w-0 flex-1 basis-80 flex-wrap items-end gap-2">
                  <input type="hidden" name="id" value={c.id} />
                  <label className="w-20 text-xs font-semibold text-ink/60">
                    Ordre
                    <input name="order_index" type="number" defaultValue={c.order_index} className={`${field} mt-1`} />
                  </label>
                  <label className="min-w-0 flex-1 basis-48 text-xs font-semibold text-ink/60">
                    Titre · {count} question{count > 1 ? "s" : ""}
                    <input name="title" required maxLength={120} defaultValue={c.title} className={`${field} mt-1`} />
                  </label>
                  <button type="submit" className="h-12 rounded-xl bg-brand-soft px-4 text-sm font-bold text-brand">
                    Enregistrer
                  </button>
                </form>
                <form action={deleteChapter}>
                  <input type="hidden" name="id" value={c.id} />
                  <button
                    type="submit"
                    disabled={count > 0}
                    title={count > 0 ? "Déplace d'abord ses questions vers un autre chapitre" : undefined}
                    className="h-12 rounded-xl px-4 text-sm font-bold text-danger ring-1 ring-ink/15 disabled:text-ink/35"
                  >
                    Supprimer
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-3 text-ink/70">Aucun chapitre pour cette matière.</p>
      )}

      <form action={addChapter} className="mt-5 flex flex-wrap items-end gap-3 rounded-3xl bg-white p-4 ring-1 ring-ink/10">
        <input type="hidden" name="subject_id" value={subject.id} />
        <label className="block min-w-56 flex-1 text-sm font-semibold">
          Nouveau chapitre
          <input name="title" required minLength={2} maxLength={120} className={`${field} mt-1.5 font-normal`} />
        </label>
        <button type="submit" className="h-12 rounded-xl bg-brand px-5 font-bold text-white hover:bg-brand-dark">
          Ajouter
        </button>
      </form>
      <p className="mt-3 text-sm text-ink/60">
        Un chapitre qui contient des questions ne peut pas être supprimé. Renommer un chapitre le renomme aussi dans
        l&apos;app.
      </p>
    </>
  );
}
