import type { Metadata } from "next";
import { submitQuestion } from "@/app/contribuer/actions";
import { QuestionForm } from "@/components/admin/question-form";
import { SubjectPicker } from "@/components/contrib/subject-picker";
import { ALL_SUBJECTS } from "@/lib/content";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Proposer une question" };

export default async function Page({ searchParams }: PageProps<"/contribuer/question">) {
  const params = await searchParams;
  const subject = ALL_SUBJECTS.find((s) => s.id === params.subject);

  const supabase = await createClient();
  const { data: chapters } = subject
    ? await supabase.from("chapters").select("id, title").eq("subject_id", subject.id).order("order_index")
    : { data: [] };

  return (
    <>
      <h1 className="mb-6 font-display text-3xl font-extrabold tracking-tight">Proposer une question</h1>
      <SubjectPicker subject={subject?.id} />
      {subject && (
        <div className="mt-5">
          <QuestionForm
            key={subject.id}
            action={submitQuestion}
            cancelHref="/contribuer"
            proposal={{ submitLabel: "Envoyer pour validation" }}
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
          <p className="mt-3 max-w-3xl text-sm text-ink/60">
            Pour une question tirée d&apos;un examen officiel, indique l&apos;année et la session : c&apos;est ainsi
            que les sujets passés sont reconstitués.
          </p>
        </div>
      )}
    </>
  );
}
