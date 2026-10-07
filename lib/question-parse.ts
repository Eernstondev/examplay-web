import { ALL_SUBJECTS } from "@/lib/content";
import { QUESTION_TYPES, type QuestionType } from "@/lib/question-types";

export type QuestionFields = {
  type: QuestionType;
  question: string;
  choices: string[] | null;
  answer: number | null;
  answer_text: string | null;
  explain: string | null;
  chapter_id: string | null;
  year: number | null;
  session: string | null;
  source: string | null;
};

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();

// Validation commune aux questions saisies par un admin et proposées par un contributeur.
export function parseQuestion(
  formData: FormData,
): { error: string } | { subject: string; fields: QuestionFields } {
  const subject = text(formData, "subject_id");
  const type = text(formData, "type") as QuestionType;
  const question = text(formData, "question");
  const choices = text(formData, "choices")
    .split("\n")
    .map((c) => c.trim())
    .filter(Boolean);
  const answer = Number(formData.get("answer"));
  const answerText = text(formData, "answer_text");
  const year = text(formData, "year");
  const chapter = text(formData, "chapter_id");

  if (!ALL_SUBJECTS.some((s) => s.id === subject)) return { error: "Choisis une matière." };
  if (!QUESTION_TYPES.some((t) => t.id === type)) return { error: "Choisis un type de question." };
  if (question.length < 5 || question.length > 2000) return { error: "Écris l'énoncé de la question." };
  if (type === "qcm") {
    if (choices.length < 2 || choices.length > 6) {
      return { error: "Un QCM a besoin de deux à six choix (un par ligne)." };
    }
    if (new Set(choices).size !== choices.length) return { error: "Deux choix sont identiques." };
    if (!Number.isInteger(answer) || answer < 0 || answer >= choices.length) {
      return { error: "La bonne réponse doit correspondre à l'un des choix." };
    }
  } else if (!answerText) {
    return { error: "Écris la réponse attendue." };
  }
  if (year && !/^(19|20)\d{2}$/.test(year)) return { error: "L'année doit avoir quatre chiffres." };
  if (chapter && !/^[0-9a-f-]{36}$/i.test(chapter)) return { error: "Chapitre inconnu." };

  return {
    subject,
    fields: {
      type,
      question,
      choices: type === "qcm" ? choices : null,
      answer: type === "qcm" ? answer : null,
      answer_text: type === "qcm" ? null : answerText,
      explain: text(formData, "explain") || null,
      chapter_id: chapter || null,
      year: year ? Number(year) : null,
      session: text(formData, "session") || null,
      source: text(formData, "source") || null,
    },
  };
}
