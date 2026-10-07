"use client";

import { useState } from "react";
import { REPORT_REASONS } from "@/lib/reports";
import { createClient } from "@/lib/supabase/client";

// Lien discret sous une question ; à remonter avec une nouvelle `key` à chaque question.
export function ReportQuestion({ questionId }: { questionId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [comment, setComment] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const send = async () => {
    setState("sending");
    const { error } = await createClient()
      .from("question_reports")
      .insert({ question_id: questionId, reason, comment: comment.trim() || null });
    // 23505 : déjà signalée par cet élève, on confirme sans erreur.
    setState(!error || error.code === "23505" ? "sent" : "error");
  };

  if (state === "sent") {
    return (
      <p role="status" className="mt-6 text-sm font-semibold text-success">
        Merci, ton signalement a été transmis à l&apos;équipe.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-6 min-h-11 text-sm font-semibold text-ink/60 underline underline-offset-4 hover:text-brand"
      >
        Signaler cette question
      </button>
    );
  }

  return (
    <fieldset className="mt-6 rounded-2xl bg-white p-4 ring-1 ring-ink/10">
      <legend className="px-1 text-sm font-bold">Quel est le problème ?</legend>
      <div className="grid gap-2">
        {REPORT_REASONS.map((r) => (
          <label
            key={r.id}
            className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold ${
              reason === r.id ? "bg-brand-soft text-brand" : "bg-ink/[0.04]"
            }`}
          >
            <input
              type="radio"
              name="report-reason"
              value={r.id}
              checked={reason === r.id}
              onChange={() => setReason(r.id)}
              className="size-4 accent-brand"
            />
            {r.label}
          </label>
        ))}
      </div>
      <label className="mt-3 block text-sm font-semibold">
        Précision (optionnel)
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={2}
          maxLength={500}
          className="mt-1.5 w-full rounded-xl border border-ink/20 bg-white px-3 py-2 text-base font-normal"
        />
      </label>
      {state === "error" && (
        <p role="alert" className="mt-2 text-sm font-semibold text-danger">
          L&apos;envoi a échoué. Vérifie ta connexion et réessaie.
        </p>
      )}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => setOpen(false)} className="h-11 rounded-xl text-sm font-bold ring-1 ring-ink/15">
          Annuler
        </button>
        <button
          type="button"
          disabled={!reason || state === "sending"}
          onClick={send}
          className="h-11 rounded-xl bg-brand text-sm font-bold text-white disabled:opacity-50"
        >
          {state === "sending" ? "Envoi…" : "Envoyer"}
        </button>
      </div>
    </fieldset>
  );
}
