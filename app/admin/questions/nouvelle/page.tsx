import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { saveQuestion } from "@/app/admin/actions";
import { QuestionForm } from "@/components/admin/question-form";
import { ALL_SUBJECTS } from "@/lib/content";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Nouvelle question" };

export default async function Page({ searchParams }: PageProps<"/admin/questions/nouvelle">) {
  const params = await searchParams;
  const subject = ALL_SUBJECTS.find((s) => s.id === params.subject);
  if (!subject) redirect("/admin/questions");

  const supabase = await createClient();
  const { data: chapters } = await supabase
    .from("chapters")
    .select("id, title")
    .eq("subject_id", subject.id)
    .order("order_index");

  return (
    <>
      <h1 className="mb-6 font-display text-3xl font-extrabold tracking-tight">Nouvelle question</h1>
      <QuestionForm
        action={saveQuestion}
        cancelHref={`/admin/questions?subject=${subject.id}`}
        subjectLabel={subject.label}
        chapters={chapters ?? []}
        values={{
          subject_id: subject.id,
          type: "qcm",
          question: "",
          choices: [],
          answer: 0,
          answer_text: "",
          explain: "",
          chapter_id: "",
          year: "",
          session: "",
          source: "",
          active: true,
        }}
      />
    </>
  );
}
