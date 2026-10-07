import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { submitQuestion } from "@/app/contribuer/actions";
import { QuestionForm } from "@/components/admin/question-form";
import { ALL_SUBJECTS } from "@/lib/content";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Proposer une correction" };

export default async function Page({ params }: PageProps<"/contribuer/correction/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const supabase = await createClient();
  const { data: q } = await supabase
    .from("questions")
    .select("id, subject_id, type, question, choices, answer, answer_text, explain, chapter_id, year, session, source")
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
      <h1 className="font-display text-3xl font-extrabold tracking-tight">Proposer une correction</h1>
      <p className="mb-6 mt-2 text-ink/70">Modifie ce qui est faux, puis explique ta correction dans le mot pour l&apos;équipe.</p>
      <QuestionForm
        action={submitQuestion}
        cancelHref={`/contribuer/correction?subject=${q.subject_id}`}
        proposal={{ questionId: q.id, submitLabel: "Envoyer la correction" }}
        subjectLabel={ALL_SUBJECTS.find((s) => s.id === q.subject_id)?.label ?? q.subject_id}
        chapters={chapters ?? []}
        values={{
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
          active: true,
        }}
      />
    </>
  );
}
