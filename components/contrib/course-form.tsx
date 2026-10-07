"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { QuestionState } from "@/app/admin/actions";
import { submitCourse } from "@/app/contribuer/actions";
import { ALL_SUBJECTS } from "@/lib/content";

const field = "mt-1.5 w-full rounded-xl border border-ink/20 bg-white px-4 py-3 text-base font-normal";
const label = "block text-sm font-semibold";

export function CourseForm() {
  const [state, action, pending] = useActionState<QuestionState, FormData>(submitCourse, { error: "" });

  return (
    <form action={action} noValidate className="grid max-w-3xl gap-5 rounded-3xl bg-white p-5 ring-1 ring-ink/10 sm:p-7">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className={label}>
          Matière
          <select name="subject_id" defaultValue="" required className={field}>
            <option value="" disabled>
              Choisis une matière
            </option>
            {ALL_SUBJECTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label className={label}>
          Chapitre concerné (optionnel)
          <input name="chapter" maxLength={120} className={field} />
        </label>
      </div>
      <label className={label}>
        Titre du cours
        <input name="title" required maxLength={150} className={field} />
      </label>
      <label className={label}>
        Contenu
        <textarea name="content" required rows={14} maxLength={20000} className={field} />
        <span className="mt-1 block text-sm font-normal text-ink/60">
          Texte simple. Saute une ligne entre les paragraphes.
        </span>
      </label>
      <label className={label}>
        Mot pour l&apos;équipe Examplay (optionnel)
        <textarea name="note" rows={2} maxLength={1000} className={field} />
      </label>
      {state.error && (
        <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm font-semibold text-danger">
          {state.error}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={pending} className="h-12 rounded-xl bg-brand px-6 font-bold text-white hover:bg-brand-dark disabled:opacity-60">
          {pending ? "Envoi…" : "Envoyer pour validation"}
        </button>
        <Link href="/contribuer" className="grid h-12 place-items-center rounded-xl px-6 font-bold text-ink/70 ring-1 ring-ink/15">
          Annuler
        </Link>
      </div>
    </form>
  );
}
