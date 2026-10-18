"use client";

import { useState } from "react";
import { useT } from "@/components/i18n-provider";

const question = {
  subject: "SVT, NS4",
  prompt: "Dans quel organite de la cellule se déroule la respiration cellulaire ?",
  choices: ["Le noyau", "La mitochondrie", "Le ribosome", "L'appareil de Golgi"],
  answer: 1,
  explanation:
    "La mitochondrie dégrade les nutriments en présence d'oxygène pour produire l'ATP, l'énergie de la cellule.",
};

const letters = ["A", "B", "C", "D"];

// Copie d'examen de démonstration : l'élève répond, le « stylo rouge » corrige.
export function SampleQuestion() {
  const t = useT();
  const [picked, setPicked] = useState<number | null>(null);
  const answered = picked !== null;
  const correct = picked === question.answer;

  return (
    <div className="relative rounded-[3px] bg-surface text-ink shadow-[0_32px_60px_-34px_rgba(11,37,89,0.55)] ring-1 ring-ink/15">
      {/* En-tête de la copie : cases Matière et Note */}
      <dl className="grid grid-cols-[1fr_5.5rem] border-b-2 border-ink sm:grid-cols-[1fr_6.5rem]">
        <div className="border-r border-ink/25 px-4 py-2 sm:px-5 sm:py-2.5">
          <dt className="text-xs text-ink/60">{t("Matière")}</dt>
          <dd className="font-semibold">{question.subject}</dd>
        </div>
        <div className="px-4 py-2.5">
          <dt className="text-xs text-ink/60">{t("Note")}</dt>
          <dd className="h-7">
            {answered && (
              <span
                key={picked}
                className="pen-note home-display text-pen inline-block origin-left text-3xl leading-7"
              >
                {correct ? "+10" : "0"}
              </span>
            )}
          </dd>
        </div>
      </dl>

      <div className="notebook relative py-[var(--line)] pr-4 pl-12 sm:pr-7 sm:pl-16">
        <span aria-hidden="true" className="margin-rule left-9 sm:left-12" />
        <span
          aria-hidden="true"
          className="home-display text-pen absolute left-2.5 text-xl leading-[var(--line)] sm:left-4 sm:text-2xl"
        >
          1.
        </span>

        <p className="leading-[var(--line)] font-semibold sm:text-xl">{question.prompt}</p>

        <ul className="mt-[var(--line)]">
          {question.choices.map((choice, i) => {
            const isAnswer = i === question.answer;
            const isPicked = i === picked;
            return (
              <li key={choice}>
                <button
                  type="button"
                  disabled={answered}
                  onClick={() => setPicked(i)}
                  className={`group flex h-[var(--line)] w-full items-center gap-2.5 text-left sm:gap-3 sm:text-[1.0625rem] ${
                    answered && !isAnswer && !isPicked ? "text-ink/45" : ""
                  }`}
                >
                  <span className="relative grid size-7 shrink-0 place-items-center font-bold sm:size-8">
                    {letters[i]}
                    {answered && isAnswer && (
                      <svg aria-hidden="true" viewBox="0 0 40 40" className="absolute -inset-1.5 size-11">
                        <path
                          className="pen-stroke"
                          pathLength={1}
                          strokeWidth={2.4}
                          d="M23 5C33 6 38 13 37 21C36 30 28 36 19 35C10 34 4 27 5 19C6 11 13 5 25 7"
                        />
                      </svg>
                    )}
                  </span>
                  <span className="relative min-w-0 group-enabled:group-hover:underline group-enabled:group-hover:underline-offset-4">
                    {choice}
                    {answered && isPicked && !isAnswer && (
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 100 10"
                        preserveAspectRatio="none"
                        className="absolute top-1/2 -left-1 h-3 w-[calc(100%+0.5rem)] -translate-y-1/2"
                      >
                        <path className="pen-stroke" pathLength={1} strokeWidth={2} vectorEffect="non-scaling-stroke" d="M1 6C30 3 62 8 99 4" />
                      </svg>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <div aria-live="polite" className="mt-[var(--line)] min-h-[var(--line)] text-[0.9375rem] leading-[var(--line)] sm:min-h-[calc(var(--line)*3)] sm:text-base">
          {answered ? (
            <>
              <p className="text-ink/80">
                <strong className="text-pen">{correct ? t("Bonne réponse.") : t("Pas tout à fait.")}</strong>{" "}
                {question.explanation}
              </p>
              <button
                type="button"
                onClick={() => setPicked(null)}
                className="font-semibold text-brand-fg underline underline-offset-4"
              >
                {t("Rejouer la question")}
              </button>
            </>
          ) : (
            <p className="text-ink/60">{t("Touche une réponse pour voir la correction.")}</p>
          )}
        </div>
      </div>
    </div>
  );
}
