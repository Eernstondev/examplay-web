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

export function SampleQuestion() {
  const [picked, setPicked] = useState<number | null>(null);
  const answered = picked !== null;

  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-[0_24px_60px_-28px_rgba(23,70,162,0.45)] sm:p-8">
      <p className="text-sm font-medium text-brand">{question.subject}</p>
      <h2 className="mt-2 font-display text-xl font-semibold leading-snug sm:text-2xl">
        {question.prompt}
      </h2>

      <ul className="mt-6 grid gap-2">
        {question.choices.map((choice, i) => {
          const isAnswer = i === question.answer;
          const isPicked = i === picked;
          const tone = !answered
            ? "border-ink/15 hover:border-brand hover:bg-brand-soft"
            : isAnswer
              ? "border-success bg-success-soft"
              : isPicked
                ? "border-danger bg-danger-soft"
                : "border-ink/10 text-ink/50";
          return (
            <li key={choice}>
              <button
                type="button"
                disabled={answered}
                onClick={() => setPicked(i)}
                className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left font-medium transition-colors ${tone}`}
              >
                <span>{choice}</span>
                {answered && isAnswer && <span className="text-sm text-success">Bonne réponse</span>}
                {answered && isPicked && !isAnswer && (
                  <span className="text-sm text-danger">Ta réponse</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      <div aria-live="polite" className="mt-5 min-h-[4.5rem] text-sm leading-relaxed text-ink/70">
        {answered ? (
          <>
            <p>{question.explanation}</p>
            <button
              type="button"
              onClick={() => setPicked(null)}
              className="mt-2 font-semibold text-brand underline underline-offset-4"
            >
              Rejouer la question
            </button>
          </>
        ) : (
          <p>Choisis une réponse pour voir la correction.</p>
        )}
      </div>
    </div>
  );
}
