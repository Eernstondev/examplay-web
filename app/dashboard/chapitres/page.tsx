import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SubHeader } from "@/components/app/ui";
import { getSubjects } from "@/lib/content";
import { getAccount } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Choisis un chapitre" };

// Type de question utilisé par chaque mode ; les fiches prennent tout.
const WANTED: Record<string, string | null> = { quiz: "qcm", short: "short_answer", essay: "essay", flash: null };

export default async function Page({ searchParams }: PageProps<"/dashboard/chapitres">) {
  const account = await getAccount();
  if (!account) redirect("/connexion");

  const params = await searchParams;
  const mode = typeof params.mode === "string" && params.mode in WANTED ? params.mode : "quiz";
  const subject = getSubjects(account.level).find((s) => s.id === params.subject);
  if (!subject) redirect(`/dashboard/matieres?mode=${mode}`);

  const supabase = await createClient();
  let query = supabase.from("questions").select("chapter_id").eq("subject_id", subject.id).eq("active", true);
  if (WANTED[mode]) query = query.eq("type", WANTED[mode]);
  const [{ data: questions }, { data: chapters }] = await Promise.all([
    query,
    supabase.from("chapters").select("id, title, order_index").eq("subject_id", subject.id).order("order_index"),
  ]);

  const byId = new Map<string | null, number>();
  (questions ?? []).forEach((q) => byId.set(q.chapter_id, (byId.get(q.chapter_id) ?? 0) + 1));
  const rows = (chapters ?? [])
    .map((c) => ({ title: c.title as string, count: byId.get(c.id) ?? 0 }))
    .filter((c) => c.count > 0);
  const general = byId.get(null) ?? 0;
  if (general > 0) rows.push({ title: "Général", count: general });
  const total = questions?.length ?? 0;

  const href = (chapter?: string) => {
    const search = new URLSearchParams({ subject: subject.id });
    if (mode !== "flash") search.set("mode", mode);
    if (chapter) search.set("chapter", chapter);
    return `/dashboard/${mode === "flash" ? "flashcards" : "quiz"}?${search}`;
  };
  const row =
    "flex items-center justify-between gap-3 rounded-2xl p-4 transition-transform active:scale-[0.98]";

  return (
    <>
      <SubHeader title={subject.name} back={`/dashboard/matieres?mode=${mode}`} />
      {total === 0 ? (
        <p className="py-10 text-center text-ink/70">Aucune question de ce type pour cette matière pour le moment.</p>
      ) : (
        <ul className="grid gap-2.5 md:grid-cols-2">
          <li className="md:col-span-2">
            <Link href={href()} className={`${row} bg-brand text-white`}>
              <span className="font-display text-lg font-semibold">Toute la matière</span>
              <span className="shrink-0 text-sm font-semibold text-white/80">{total} questions</span>
            </Link>
          </li>
          {rows.map((c) => (
            <li key={c.title}>
              <Link href={href(c.title)} className={`${row} bg-surface ring-1 ring-ink/10 hover:ring-2 hover:ring-brand`}>
                <span className="font-semibold leading-snug">{c.title}</span>
                <span className="shrink-0 text-sm text-ink/60">{c.count}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
