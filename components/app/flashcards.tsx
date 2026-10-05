"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ProgressBar, primaryButton, secondaryButton } from "@/components/app/ui";
import { shuffle } from "@/lib/seeded";
import { createClient } from "@/lib/supabase/client";

type Card = { q: string; answer: string; explain: string };
const SERIES_SIZE = 20;

export function Flashcards({ subject }: { subject: string }) {
  const [pool, setPool] = useState<Card[] | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    let alive = true;
    createClient()
      .from("questions")
      .select("type, question, choices, answer, answer_text, explain")
      .eq("subject_id", subject)
      .eq("active", true)
      .order("id", { ascending: true })
      .then(({ data }) => {
        if (!alive) return;
        const list: Card[] = (data ?? [])
          .map((r) => ({
            q: r.question as string,
            answer:
              r.type === "qcm"
                ? ((r.choices as string[] | null)?.[r.answer ?? 0] ?? "")
                : ((r.answer_text as string | null) ?? ""),
            explain: (r.explain as string | null) ?? "",
          }))
          .filter((c) => c.answer);
        setPool(list);
        setCards(shuffle(list).slice(0, SERIES_SIZE));
      });
    return () => {
      alive = false;
    };
  }, [subject]);

  const next = (wasKnown: boolean) => {
    if (wasKnown) setKnown((k) => k + 1);
    setFlipped(false);
    if (idx + 1 < cards.length) setIdx(idx + 1);
    else setFinished(true);
  };

  const restart = () => {
    if (pool) setCards(shuffle(pool).slice(0, SERIES_SIZE));
    setIdx(0);
    setKnown(0);
    setFlipped(false);
    setFinished(false);
  };

  if (pool === null) return <p className="py-16 text-center text-ink/70">Chargement des fiches…</p>;
  if (!cards.length) {
    return <p className="py-12 text-center text-ink/75">Aucune fiche pour cette matière pour le moment.</p>;
  }

  if (finished) {
    return (
      <div className="mx-auto max-w-md py-6 text-center">
        <p className="font-display text-[clamp(3.5rem,18vw,5.5rem)] font-extrabold leading-none text-brand">
          {known} / {cards.length}
        </p>
        <p className="mt-3 text-ink/75">fiches que tu savais déjà. {cards.length - known} à revoir.</p>
        <div className="mt-8 grid gap-3">
          <button type="button" onClick={restart} className={primaryButton}>
            Nouvelle série
          </button>
          <Link href="/dashboard" className={secondaryButton}>
            Retour au tableau de bord
          </Link>
        </div>
      </div>
    );
  }

  const card = cards[idx];

  return (
    <div className="mx-auto max-w-xl">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <ProgressBar value={(idx / cards.length) * 100} />
        </div>
        <span className="text-sm font-semibold tabular-nums text-ink/60">
          {idx + 1} / {cards.length}
        </span>
      </div>

      <button
        type="button"
        onClick={() => setFlipped(!flipped)}
        aria-live="polite"
        className={`mt-6 flex min-h-72 w-full flex-col justify-center rounded-3xl p-6 text-left transition-colors sm:p-8 ${
          flipped ? "bg-brand text-white" : "bg-white ring-1 ring-ink/10"
        }`}
      >
        <span className={`text-sm font-semibold ${flipped ? "text-white/70" : "text-ink/55"}`}>
          {flipped ? "Réponse" : "Question"}
        </span>
        <span className="mt-2 font-display text-[clamp(1.25rem,5vw,1.625rem)] font-semibold leading-snug">
          {flipped ? card.answer : card.q}
        </span>
        {flipped && card.explain && <span className="mt-3 text-white/85">{card.explain}</span>}
        {!flipped && <span className="mt-6 text-sm text-ink/55">Touche la carte pour la retourner</span>}
      </button>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <button type="button" disabled={!flipped} onClick={() => next(false)} className={`${secondaryButton} disabled:opacity-50`}>
          À revoir
        </button>
        <button type="button" disabled={!flipped} onClick={() => next(true)} className={primaryButton}>
          Je savais
        </button>
      </div>
    </div>
  );
}
