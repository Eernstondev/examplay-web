"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function SubHeader({ title, back = "/dashboard" }: { title: string; back?: string }) {
  return (
    <div className="mb-6 mt-2">
      <Link href={back} className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-brand-fg">
        <svg viewBox="0 0 20 20" aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12.5 4.5 7 10l5.5 5.5" />
        </svg>
        Retour
      </Link>
      <h1 className="mt-1 font-display text-[clamp(1.625rem,7vw,2.5rem)] font-extrabold leading-[1.08] tracking-tight">
        {title}
      </h1>
    </div>
  );
}

// Compte à rebours ; à remonter avec une nouvelle `key` pour le relancer.
export function Countdown({ seconds, onExpire }: { seconds: number; onExpire: () => void }) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    const timer = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (remaining === 0) onExpire();
    // onExpire change à chaque rendu ; seul le passage à zéro compte.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining]);

  return (
    <span
      role="timer"
      className={`grid h-9 min-w-12 place-items-center rounded-full px-3 text-sm font-bold tabular-nums ${
        remaining <= 5 ? "bg-danger-soft text-danger-fg" : "bg-brand-soft text-brand-fg"
      }`}
    >
      {remaining} s
    </span>
  );
}

export function ProgressBar({ value, tone = "brand" }: { value: number; tone?: "brand" | "sun" }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-ink/10">
      <div
        className={`h-full rounded-full ${tone === "sun" ? "bg-sun" : "bg-brand"}`}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export const choiceClass = (state: "idle" | "picked" | "right" | "wrong" | "muted") =>
  `flex min-h-14 w-full items-center gap-3 rounded-xl border-2 px-3 py-2.5 text-left font-semibold transition-colors ${
    {
      idle: "border-ink/15 bg-surface hover:border-brand",
      picked: "border-brand bg-brand-soft",
      right: "border-success bg-success-soft",
      wrong: "border-danger bg-danger-soft",
      muted: "border-ink/10 bg-surface text-ink/45",
    }[state]
  }`;

export const primaryButton =
  "flex h-13 w-full items-center justify-center rounded-xl bg-brand px-6 text-base font-bold text-white hover:bg-brand-dark disabled:opacity-50";
export const secondaryButton =
  "flex h-13 w-full items-center justify-center rounded-xl bg-surface px-6 text-base font-bold text-brand-fg ring-1 ring-ink/15 hover:bg-brand-soft";
