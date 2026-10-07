"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { QuestionState } from "@/app/admin/actions";
import { QUESTION_TYPES, type QuestionType } from "@/lib/question-types";

export type QuestionValues = {
  id?: string;
  subject_id: string;
  type: QuestionType;
  question: string;
  choices: string[];
  answer: number;
  answer_text: string;
  explain: string;
  chapter_id: string;
  year: string;
  session: string;
  source: string;
  active: boolean;
};

type Props = {
  values: QuestionValues;
  subjectLabel: string;
  chapters: { id: string; title: string }[];
  action: (prev: QuestionState, formData: FormData) => Promise<QuestionState>;
  cancelHref: string;
  // Proposition d'un contributeur : pas de case « Active », un mot pour l'équipe à la place.
  proposal?: { questionId?: string; submissionId?: string; submitLabel: string; noteLabel?: string };
};

const field = "mt-1.5 w-full rounded-xl border border-ink/20 bg-white px-4 py-3 text-base font-normal";
const label = "block text-sm font-semibold";

export function QuestionForm({ values, subjectLabel, chapters, action: save, cancelHref, proposal }: Props) {
  const [state, action, pending] = useActionState<QuestionState, FormData>(save, { error: "" });
  const [type, setType] = useState<QuestionType>(values.type);
  const [choices, setChoices] = useState(values.choices.join("\n"));
  const lines = choices.split("\n").map((c) => c.trim()).filter(Boolean);

  return (
    <form action={action} noValidate className="grid max-w-3xl gap-5 rounded-3xl bg-white p-5 ring-1 ring-ink/10 sm:p-7">
      {values.id && !proposal && <input type="hidden" name="id" value={values.id} />}
      {proposal?.questionId && <input type="hidden" name="question_id" value={proposal.questionId} />}
      {proposal?.submissionId && <input type="hidden" name="submission_id" value={proposal.submissionId} />}
      <input type="hidden" name="subject_id" value={values.subject_id} />
      <p className="text-sm text-ink/70">
        Matière : <strong className="font-semibold text-ink">{subjectLabel}</strong>
      </p>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className={label}>
          Type
          <select name="type" value={type} onChange={(e) => setType(e.target.value as QuestionType)} className={field}>
            {QUESTION_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label className={label}>
          Chapitre
          <select name="chapter_id" defaultValue={values.chapter_id} className={field}>
            <option value="">Aucun (Général)</option>
            {chapters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className={label}>
        Énoncé
        <textarea name="question" required rows={3} defaultValue={values.question} className={field} />
      </label>

      {type === "qcm" ? (
        <div className="grid gap-5 sm:grid-cols-[2fr_1fr]">
          <label className={label}>
            Choix (un par ligne)
            <textarea
              name="choices"
              required
              rows={5}
              value={choices}
              onChange={(e) => setChoices(e.target.value)}
              className={field}
            />
          </label>
          <label className={label}>
            Bonne réponse
            <select name="answer" defaultValue={values.answer} key={lines.length} className={field}>
              {lines.map((c, i) => (
                <option key={i} value={i}>
                  {String.fromCharCode(65 + i)} · {c.slice(0, 40)}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : (
        <label className={label}>
          {type === "essay" ? "Modèle de réponse" : "Réponse attendue"}
          <textarea
            name="answer_text"
            required
            rows={type === "essay" ? 6 : 2}
            defaultValue={values.answer_text}
            className={field}
          />
        </label>
      )}

      <label className={label}>
        Explication (affichée après la réponse)
        <textarea name="explain" rows={3} defaultValue={values.explain} className={field} />
      </label>

      <div className="grid gap-5 sm:grid-cols-3">
        <label className={label}>
          Année
          <input name="year" inputMode="numeric" maxLength={4} defaultValue={values.year} className={field} />
        </label>
        <label className={label}>
          Session
          <input name="session" defaultValue={values.session} className={field} />
        </label>
        <label className={label}>
          Source
          <input name="source" defaultValue={values.source} className={field} />
        </label>
      </div>

      {proposal ? (
        <label className={label}>
          {proposal.noteLabel ?? "Mot pour l'équipe Examplay (optionnel)"}
          <textarea name="note" rows={2} maxLength={1000} className={field} />
        </label>
      ) : (
        <label className="flex items-center gap-3 text-sm font-semibold">
          <input type="checkbox" name="active" defaultChecked={values.active} className="size-5 accent-brand" />
          Active (visible par les élèves, sur le site et dans l&apos;app)
        </label>
      )}

      {state.error && (
        <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm font-semibold text-danger">
          {state.error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={pending}
          className="h-12 rounded-xl bg-brand px-6 font-bold text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {pending ? "Envoi…" : (proposal?.submitLabel ?? "Enregistrer")}
        </button>
        <Link
          href={cancelHref}
          className="grid h-12 place-items-center rounded-xl px-6 font-bold text-ink/70 ring-1 ring-ink/15"
        >
          Annuler
        </Link>
      </div>
    </form>
  );
}
