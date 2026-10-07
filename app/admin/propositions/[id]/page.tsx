import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { approveEditedSubmission } from "@/app/admin/actions";
import { QuestionForm } from "@/components/admin/question-form";
import { ALL_SUBJECTS } from "@/lib/content";
import type { QuestionFields } from "@/lib/question-parse";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Modifier une proposition" };

export default async function Page({ params }: PageProps<"/admin/propositions/[id]">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const supabase = await createClient();
  const { data: s } = await supabase
    .from("submissions")
    .select("id, kind, status, subject_id, payload, note, author:profiles(name)")
    .eq("id", id)
    .maybeSingle();
  // Seules les questions et corrections encore en attente se retouchent ici.
  if (!s || s.status !== "pending" || s.kind === "course") notFound();

  const { data: chapters } = await supabase
    .from("chapters")
    .select("id, title")
    .eq("subject_id", s.subject_id)
    .order("order_index");
  const p = s.payload as QuestionFields;
  const author = (Array.isArray(s.author) ? s.author[0] : s.author) as { name: string } | null;

  return (
    <>
      <h1 className="font-display text-3xl font-extrabold tracking-tight">Modifier avant d&apos;approuver</h1>
      <p className="mb-6 mt-2 max-w-3xl text-ink/70">
        Proposition de {author?.name ?? "un contributeur"}. Ta version remplace la sienne au moment de la
        publication.
        {s.note && (
          <span className="mt-2 block rounded-xl bg-white px-3 py-2 text-sm ring-1 ring-ink/10">
            <strong>Son mot :</strong> {s.note}
          </span>
        )}
      </p>
      <QuestionForm
        action={approveEditedSubmission}
        cancelHref="/admin/propositions"
        proposal={{
          submissionId: s.id,
          noteLabel: "Réponse au contributeur (optionnel)",
          submitLabel: s.kind === "correction" ? "Enregistrer et corriger" : "Enregistrer et publier",
        }}
        subjectLabel={ALL_SUBJECTS.find((x) => x.id === s.subject_id)?.label ?? s.subject_id}
        chapters={chapters ?? []}
        values={{
          subject_id: s.subject_id,
          type: p.type,
          question: p.question,
          choices: p.choices ?? [],
          answer: p.answer ?? 0,
          answer_text: p.answer_text ?? "",
          explain: p.explain ?? "",
          chapter_id: p.chapter_id ?? "",
          year: p.year ? String(p.year) : "",
          session: p.session ?? "",
          source: p.source ?? "",
          active: true,
        }}
      />
    </>
  );
}
