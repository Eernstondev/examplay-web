"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useT } from "@/components/i18n-provider";

export function SubHeader({ title, back = "/dashboard" }: { title: string; back?: string }) {
  const t = useT();
  return (
    <div className="mb-6 mt-2">
      <Link href={back} className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-brand-fg">
        <svg viewBox="0 0 20 20" aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12.5 4.5 7 10l5.5 5.5" />
        </svg>
        {t("Retour")}
      </Link>
      <h1 className="mt-1 text-[clamp(1.625rem,5vw,2.25rem)] font-semibold leading-[1.1] tracking-[-0.03em]">
        {title}
      </h1>
    </div>
  );
}

// Compte à rebours ; à remonter avec une nouvelle `key` pour le relancer.
export function Countdown({ seconds, onExpire }: { seconds: number; onExpire: () => void }) {
  const t = useT();
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
      className={`grid h-9 min-w-12 place-items-center rounded-full px-3 text-sm font-semibold tabular-nums ${
        remaining <= 5 ? "bg-danger-soft text-danger-fg" : "bg-brand-soft text-brand-fg"
      }`}
    >
      {remaining}{t(" s")}
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
  `flex min-h-14 w-full items-center gap-3 rounded-2xl border-2 px-3 py-2.5 text-left font-medium transition-colors ${
    {
      idle: "border-ink/15 bg-surface hover:border-brand",
      picked: "border-brand bg-brand-soft",
      right: "border-success bg-success-soft",
      wrong: "border-danger bg-danger-soft",
      muted: "border-ink/10 bg-surface text-ink/45",
    }[state]
  }`;

export const primaryButton =
  "flex h-12 w-full items-center justify-center rounded-full bg-brand px-6 text-base font-medium text-white hover:bg-brand-dark disabled:opacity-50";
export const secondaryButton =
  "flex h-12 w-full items-center justify-center rounded-full bg-surface px-6 text-base font-medium text-brand-fg ring-1 ring-ink/15 hover:bg-brand-soft";
