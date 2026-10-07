export const REPORT_REASONS = [
  { id: "wrong_answer", label: "Mauvaise réponse" },
  { id: "statement_error", label: "Erreur dans l'énoncé" },
  { id: "unclear", label: "Question incompréhensible" },
  { id: "technical", label: "Problème technique" },
  { id: "inappropriate", label: "Contenu inapproprié" },
] as const;

export const SUBMISSION_KINDS = { question: "Nouvelle question", correction: "Correction", course: "Cours" } as const;
export const SUBMISSION_STATUS = {
  pending: { label: "En attente", className: "bg-brand-soft text-brand" },
  approved: { label: "Publiée", className: "bg-success-soft text-success" },
  rejected: { label: "Refusée", className: "bg-danger-soft text-danger" },
} as const;
