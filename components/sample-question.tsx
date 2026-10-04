"use client";

import { useState } from "react";

const question = {
  subject: "SVT, NS4",
  prompt: "Dans quel organite de la cellule se déroule la respiration cellulaire\u00a0?",
  choices: ["Le noyau", "La mitochondrie", "Le ribosome", "L'appareil de Golgi"],
  answer: 1,
  explanation:
    "La mitochondrie dégrade les nutriments en présence d'oxygène pour produire l'ATP, l'énergie de la cellule.",
};

const letters = ["A", "B", "C", "D"];

export function SampleQuestion() {
  const [picked, setPicked] = useState<number | null>(null);
  const answered = picked !== null;

  return (
    <div className="rounded-3xl bg-white p-5 text-ink shadow-[0_30px_60px_-30px_rgba(11,37,89,0.55)] ring-1 ring-ink/10 sm:p-7">
      <div className="flex items-center justify-between gap-3 text-sm font-semibold">
        <span className="text-brand">{question.subject}</span>
        <span className="text-ink/50">Essaie une question</span>
      </div>
      <h2 className="mt-3 font-display text-xl font-semibold leading-snug sm:text-2xl">
        {question.prompt}
      </h2>

      <ul className="mt-5 grid gap-2.5">
        {question.choices.map((choice, i) => {
          const isAnswer = i === question.answer;
          const isPicked = i === picked;
          const tone = !answered
            ? "border-ink/15 hover:border-brand hover:bg-brand-soft"
            : isAnswer
              ? "border-success bg-success-soft"
              : isPicked
                ? "border-danger bg-danger-soft"
                : "border-ink/10 text-ink/45";
          const badge = !answered
            ? "bg-brand-soft text-brand"
            : isAnswer
              ? "bg-success text-white"
              : isPicked
                ? "bg-danger text-white"
                : "bg-ink/5 text-ink/40";
          return (
            <li key={choice}>
              <button
                type="button"
                disabled={answered}
                onClick={() => setPicked(i)}
                className={`flex min-h-14 w-full items-center gap-3 rounded-xl border-2 px-3 py-2.5 text-left font-semibold transition-colors ${tone}`}
              >
                <span
                  className={`grid size-8 shrink-0 place-items-center rounded-lg text-sm font-bold ${badge}`}
                >
                  {letters[i]}
                </span>
                <span className="min-w-0 flex-1">{choice}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <div aria-live="polite" className="mt-4 min-h-24 text-sm leading-relaxed text-ink/70">
        {answered ? (
          <>
            <p>
              <strong className="text-ink">
                {picked === question.answer ? "Bonne réponse." : "Pas tout à fait."}
              </strong>{" "}
              {question.explanation}
            </p>
            <button
              type="button"
              onClick={() => setPicked(null)}
              className="mt-1 min-h-11 font-semibold text-brand underline underline-offset-4"
            >
              Rejouer la question
            </button>
          </>
        ) : (
          <p>Touche une réponse pour voir la correction.</p>
        )}
      </div>
    </div>
  );
}
