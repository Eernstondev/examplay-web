"use client";

import { useState, type ComponentPropsWithoutRef } from "react";

const input =
  "h-13 w-full rounded-xl border border-ink/20 bg-surface pl-4 pr-14 text-base text-ink placeholder:text-ink/40";

// Champ mot de passe avec bouton « afficher / masquer ».
export function PasswordInput(props: Omit<ComponentPropsWithoutRef<"input">, "type" | "className">) {
  const [shown, setShown] = useState(false);
  return (
    <span className="relative mt-1.5 block">
      <input {...props} type={shown ? "text" : "password"} className={input} />
      <button
        type="button"
        onClick={() => setShown((value) => !value)}
        aria-label={shown ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        aria-pressed={shown}
        className="absolute inset-y-0 right-1 grid w-12 place-items-center rounded-xl text-ink/60 hover:text-ink"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          {shown ? (
            <>
              <path d="M3 3l18 18" />
              <path d="M10.6 6.1A10.7 10.7 0 0 1 12 6c5 0 8.5 4 9.5 6a14 14 0 0 1-2.6 3.4M6.6 7.6C4.6 9 3.3 10.9 2.5 12c1 2 4.5 6 9.5 6a9.7 9.7 0 0 0 3.4-.6" />
              <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
            </>
          ) : (
            <>
              <path d="M2.5 12C3.5 10 7 6 12 6s8.5 4 9.5 6c-1 2-4.5 6-9.5 6s-8.5-4-9.5-6z" />
              <circle cx="12" cy="12" r="3" />
            </>
          )}
        </svg>
      </button>
    </span>
  );
}
