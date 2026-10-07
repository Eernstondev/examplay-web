import type { Metadata } from "next";
import Link from "next/link";
import { SubjectPicker } from "@/components/contrib/subject-picker";
import { ALL_SUBJECTS } from "@/lib/content";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Corriger une question" };

export default async function Page({ searchParams }: PageProps<"/contribuer/correction">) {
  const params = await searchParams;
  const subject = ALL_SUBJECTS.find((s) => s.id === params.subject);
  const search = typeof params.q === "string" ? params.q.trim() : "";

  let rows: { id: string; question: string }[] = [];
  if (subject) {
    const supabase = await createClient();
    let query = supabase.from("questions").select("id, question").eq("subject_id", subject.id).eq("active", true);
    if (search) query = query.ilike("question", `%${search.replace(/[%_\\]/g, "\\$&")}%`);
    rows = (await query.order("created_at", { ascending: false }).limit(40)).data ?? [];
  }

  return (
    <>
      <h1 className="mb-6 font-display text-3xl font-extrabold tracking-tight">Corriger une question</h1>
      <SubjectPicker subject={subject?.id} search={search} />
      {subject &&
        (rows.length ? (
          <ul className="mt-5 grid gap-2">
            {rows.map((q) => (
              <li key={q.id}>
                <Link
                  href={`/contribuer/correction/${q.id}`}
                  className="block rounded-2xl bg-white p-4 font-semibold leading-snug ring-1 ring-ink/10 hover:ring-2 hover:ring-brand"
                >
                  <span className="line-clamp-2">{q.question}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-8 text-center text-ink/70">Aucune question trouvée.</p>
        ))}
      {subject && rows.length === 40 && (
        <p className="mt-3 text-sm text-ink/60">Seules 40 questions sont affichées : précise ta recherche.</p>
      )}
    </>
  );
}
