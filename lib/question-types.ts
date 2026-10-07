export const QUESTION_TYPES = [
  { id: "qcm", label: "QCM" },
  { id: "short_answer", label: "Réponse courte" },
  { id: "essay", label: "Rédaction" },
] as const;

export type QuestionType = (typeof QUESTION_TYPES)[number]["id"];
