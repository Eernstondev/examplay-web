"use client";

import { useActionState } from "react";
import { joinWaitlist, type WaitlistState } from "@/app/actions";

const initialState: WaitlistState = { status: "idle", message: "" };

// Formulaire conçu pour les fonds bleus (hero et bandeau final).
export function WaitlistForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState(joinWaitlist, initialState);

  if (state.status === "success") {
    return (
      <div
        role="status"
        className="flex w-full max-w-lg items-center gap-3 rounded-2xl bg-white p-4 text-ink sm:p-5"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" className="size-9 shrink-0 text-success">
          <circle cx="12" cy="12" r="12" fill="currentColor" />
          <path
            d="m7 12.5 3.2 3.2L17 9"
            fill="none"
            stroke="#fff"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <p className="font-semibold leading-snug">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={action} noValidate className="w-full max-w-lg">
      <label htmlFor={id} className="sr-only">
        Ton adresse e-mail
      </label>
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-1.5 sm:rounded-2xl sm:bg-white sm:p-1.5">
        <input
          id={id}
          name="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          enterKeyHint="send"
          placeholder="Ton adresse e-mail"
          aria-describedby={state.status === "error" ? `${id}-error` : `${id}-note`}
          aria-invalid={state.status === "error"}
          className="h-14 w-full min-w-0 shrink-0 rounded-xl sm:flex-1 sm:shrink bg-white px-4 text-base text-ink placeholder:text-ink/45 focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ink focus-visible:ring-4 focus-visible:ring-sun/80 sm:h-12 sm:rounded-[10px] sm:px-3.5 sm:focus-visible:ring-0"
        />
        {/* Champ piège anti-robots, invisible pour les utilisateurs */}
        <input
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="hidden"
        />
        <button
          type="submit"
          disabled={pending}
          className="btn-sun h-14 shrink-0 rounded-xl px-6 text-base font-bold disabled:opacity-70 sm:h-12 sm:rounded-[10px] sm:px-5 sm:shadow-none"
        >
          {pending ? "Inscription…" : "Me prévenir au lancement"}
        </button>
      </div>
      {state.status === "error" ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-4 rounded-lg bg-white px-3.5 py-2.5 text-sm font-semibold text-danger"
        >
          {state.message}
        </p>
      ) : (
        <p id={`${id}-note`} className="mt-4 text-sm text-white/75 sm:mt-3">
          Gratuit. Un seul e-mail, le jour de la sortie.
        </p>
      )}
    </form>
  );
}
