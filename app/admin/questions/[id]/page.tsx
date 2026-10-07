import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { saveQuestion } from "@/app/admin/actions";
import { QuestionForm } from "@/components/admin/question-form";
import { ALL_SUBJECTS } from "@/lib/content";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Modifier la question" };

export default async function Page({ params }: PageProps<"/admin/questions/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const supabase = await createClient();
  const { data: q } = await supabase
    .from("questions")
    .select("id, subject_id, type, question, choices, answer, answer_text, explain, chapter_id, year, session, source, active")
    .eq("id", id)
    .maybeSingle();
  if (!q) notFound();

  const { data: chapters } = await supabase
    .from("chapters")
    .select("id, title")
    .eq("subject_id", q.subject_id)
    .order("order_index");

  return (
    <>
      <h1 className="mb-6 font-display text-3xl font-extrabold tracking-tight">Modifier la question</h1>
      <QuestionForm
        action={saveQuestion}
        cancelHref={`/admin/questions?subject=${q.subject_id}`}
        subjectLabel={ALL_SUBJECTS.find((s) => s.id === q.subject_id)?.label ?? q.subject_id}
        chapters={chapters ?? []}
        values={{
          id: q.id,
          subject_id: q.subject_id,
          type: q.type,
          question: q.question,
          choices: (q.choices as string[] | null) ?? [],
          answer: q.answer ?? 0,
          answer_text: q.answer_text ?? "",
          explain: q.explain ?? "",
          chapter_id: q.chapter_id ?? "",
          year: q.year ? String(q.year) : "",
          session: q.session ?? "",
          source: q.source ?? "",
          active: q.active,
        }}
      />
    </>
  );
}
