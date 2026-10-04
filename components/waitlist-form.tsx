"use client";

import { useActionState } from "react";
import { joinWaitlist, type WaitlistState } from "@/app/actions";

const initialState: WaitlistState = { status: "idle", message: "" };

export function WaitlistForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState(joinWaitlist, initialState);

  if (state.status === "success") {
    return (
      <p role="status" className="text-lg font-medium">
        {state.message}
      </p>
    );
  }

  return (
    <form action={action} noValidate className="w-full max-w-md">
      <label htmlFor={id} className="mb-2 block text-sm font-medium">
        Ton adresse e-mail
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id={id}
          name="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder="nom@exemple.com"
          aria-describedby={state.status === "error" ? `${id}-error` : undefined}
          aria-invalid={state.status === "error"}
          className="h-12 min-w-0 flex-1 rounded-lg border border-ink/20 bg-white px-4 text-ink placeholder:text-ink/40"
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
          className="waitlist-submit h-12 shrink-0 rounded-lg px-5 font-semibold disabled:opacity-60"
        >
          {pending ? "Inscription…" : "Me prévenir au lancement"}
        </button>
      </div>
      {state.status === "error" && (
        <p id={`${id}-error`} role="alert" className="mt-2 text-sm font-medium">
          {state.message}
        </p>
      )}
    </form>
  );
}
