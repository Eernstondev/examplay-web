"use client";

import { useActionState } from "react";
import type { QuestionState } from "@/app/admin/actions";
import { applyAsContributor } from "@/app/contribuer/actions";

const field = "mt-1.5 w-full rounded-xl border border-ink/20 bg-white px-4 py-3 text-base font-normal";
const label = "block text-sm font-semibold";

export function ApplicationForm() {
  const [state, action, pending] = useActionState<QuestionState, FormData>(applyAsContributor, { error: "" });

  return (
    <form action={action} noValidate className="mt-5 grid gap-4">
      <label className={label}>
        Matière(s) enseignée(s)
        <input name="subjects" required maxLength={200} placeholder="Ex. : Mathématiques, Physique" className={field} />
      </label>
      <label className={label}>
        Établissement ou organisation
        <input name="school" required maxLength={200} className={field} />
      </label>
      <label className={label}>
        Présentation (optionnel)
        <textarea name="message" rows={3} maxLength={1000} className={field} />
      </label>
      {state.error && (
        <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm font-semibold text-danger">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className="h-12 rounded-xl bg-brand font-bold text-white hover:bg-brand-dark disabled:opacity-60">
        {pending ? "Envoi…" : "Envoyer ma demande"}
      </button>
    </form>
  );
}
