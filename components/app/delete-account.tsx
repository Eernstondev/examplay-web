"use client";

import { useActionState, useState } from "react";
import { deleteAccount, type DeleteState } from "@/app/actions";

export function DeleteAccount() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<DeleteState, FormData>(deleteAccount, { error: "" });

  return (
    <section className="mt-8 rounded-3xl bg-surface p-5 ring-1 ring-danger/30">
      <h2 className="font-display text-lg font-bold text-danger-fg">Supprimer mon compte</h2>
      <p className="mt-1 text-sm leading-relaxed text-ink/70">
        Cette action est définitive : ton compte, tes résultats, tes duels et tes badges sont effacés, sur le site
        comme dans l&apos;app.
      </p>
      {open ? (
        <form action={action} className="mt-4 grid gap-3 sm:max-w-sm">
          <label className="block text-sm font-semibold">
            Pour confirmer, écris SUPPRIMER
            <input
              name="confirm"
              autoComplete="off"
              autoCapitalize="characters"
              className="mt-1.5 h-12 w-full rounded-xl border border-ink/20 bg-surface px-4 text-base font-normal"
            />
          </label>
          {state.error && (
            <p role="alert" className="text-sm font-semibold text-danger-fg">
              {state.error}
            </p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setOpen(false)} className="h-12 rounded-xl font-bold ring-1 ring-ink/15">
              Annuler
            </button>
            <button type="submit" disabled={pending} className="h-12 rounded-xl bg-danger font-bold text-white disabled:opacity-60">
              {pending ? "Suppression…" : "Supprimer"}
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-4 h-12 rounded-xl px-5 font-bold text-danger-fg ring-1 ring-danger/40"
        >
          Supprimer mon compte
        </button>
      )}
    </section>
  );
}
