"use client";

import { useActionState } from "react";
import { addContributor, type FormState } from "@/app/admin/actions";

export function ContributorForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(addContributor, { error: "" });
  return (
    <form action={action} className="rounded-3xl bg-white p-4 ring-1 ring-ink/10">
      <div className="flex flex-wrap items-end gap-3">
        <label className="block min-w-56 flex-1 text-sm font-semibold">
          E-mail du compte Examplay de l&apos;enseignant ou de l&apos;expert
          <input
            name="email"
            type="email"
            required
            className="mt-1.5 h-12 w-full rounded-xl border border-ink/20 bg-white px-3 text-base font-normal"
          />
        </label>
        <button type="submit" disabled={pending} className="h-12 rounded-xl bg-brand px-5 font-bold text-white hover:bg-brand-dark disabled:opacity-60">
          {pending ? "Ajout…" : "Donner l'accès"}
        </button>
      </div>
      {state.error && (
        <p role="alert" className="mt-3 text-sm font-semibold text-danger">
          {state.error}
        </p>
      )}
    </form>
  );
}
