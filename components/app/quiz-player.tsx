"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Countdown, ProgressBar, choiceClass, primaryButton, secondaryButton } from "@/components/app/ui";
import { isAnswerClose } from "@/lib/fuzzy";
import { shuffle } from "@/lib/seeded";
import { createClient } from "@/lib/supabase/client";

export type QuizMode = "quiz" | "exam" | "short" | "essay";
type QType = "qcm" | "short_answer" | "essay";

type Question = {
  q: string;
  type: QType;
  choices: string[];
  answer: number;
  answerText: string;
  explain: string;
  chapterTitle: string | null;
};

// Format attendu par le trigger recompute_result_score (identique à l'app mobile).
type DetailedAnswer = {
  q: string;
  type: QType;
  choices: string[];
  given: number | null;
  givenText: string;
  correct: number;
  correctText: string;
  explain: string;
  isCorrect: boolean;
};

const TIME_FOR_TYPE: Record<QType, number> = { qcm: 20, short_answer: 45, essay: 90 };
const WANTED: Record<QuizMode, QType> = { quiz: "qcm", exam: "qcm", short: "short_answer", essay: "essay" };

type Props = { subject: string; subjectName: string; mode: QuizMode; level: string; backHref: string };

export function QuizPlayer({ subject, subjectName, mode, level, backHref }: Props) {
  const [pool, setPool] = useState<Question[] | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [typed, setTyped] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [answers, setAnswers] = useState<DetailedAnswer[]>([]);
  const [done, setDone] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const startedAt = useRef(0);

  const pick = (all: Question[]) => {
    const shuffled = shuffle(all);
    setQuestions(mode === "quiz" ? shuffled.slice(0, 5) : shuffled);
    startedAt.current = Date.now();
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      const supabase = createClient();
      const [qRes, cRes] = await Promise.all([
        supabase
          .from("questions")
          .select("chapter_id, type, question, choices, answer, answer_text, explain")
          .eq("subject_id", subject)
          .eq("active", true)
          .eq("type", WANTED[mode])
          .order("id", { ascending: true }),
        supabase.from("chapters").select("id, title").eq("subject_id", subject),
      ]);
      if (!alive) return;
      const titles = new Map((cRes.data ?? []).map((c) => [c.id as string, c.title as string]));
      const list: Question[] = (qRes.data ?? []).map((r) => ({
        q: r.question,
        type: r.type,
        choices: (r.choices as string[] | null) ?? [],
        answer: r.answer ?? 0,
        answerText: r.answer_text ?? "",
        explain: r.explain ?? "",
        chapterTitle: r.chapter_id ? (titles.get(r.chapter_id) ?? null) : null,
      }));
      setPool(list);
      pick(list);
    })();
    return () => {
      alive = false;
    };
    // pick ne dépend que du mode, déjà dans la liste.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject, mode]);

  const save = async (all: DetailedAnswer[]) => {
    const supabase = createClient();
    const correct = all.filter((a) => a.isCorrect).length;
    const [result] = await Promise.all([
      supabase.from("results").insert({
        id: crypto.randomUUID(),
        level,
        subject_id: subject,
        subject_name: subjectName,
        mode,
        correct,
        total: all.length,
        answers: all,
        duration_sec: Math.round((Date.now() - startedAt.current) / 1000),
      }),
      supabase.from("attempts").insert(
        all.map((a, i) => ({
          subject_id: subject,
          skill: "concepts",
          correct: a.isCorrect,
          chapter: questions[i]?.chapterTitle ?? null,
          subject_name: subjectName,
        })),
      ),
    ]);
    setSaveError(!!result.error);
  };

  const q = questions[idx];

  const commit = (isCorrect: boolean, given: number | null, givenText = "") => {
    if (!q) return;
    const next = [
      ...answers,
      {
        q: q.q,
        type: q.type,
        choices: q.choices,
        given,
        givenText,
        correct: q.answer,
        correctText: q.answerText,
        explain: q.explain,
        isCorrect,
      },
    ];
    setAnswers(next);
    if (idx + 1 >= questions.length) {
      setDone(true);
      save(next);
    } else {
      setIdx(idx + 1);
      setSelected(null);
      setTyped("");
      setRevealed(false);
    }
  };

  const restart = () => {
    if (pool) pick(pool);
    setIdx(0);
    setSelected(null);
    setTyped("");
    setRevealed(false);
    setAnswers([]);
    setDone(false);
    setSaveError(false);
    setShowReview(false);
  };

  if (pool === null) return <p className="py-16 text-center text-ink/70">Chargement des questions…</p>;

  if (!questions.length) {
    return (
      <div className="py-12 text-center">
        <p className="text-ink/75">Aucune question de ce type pour cette matière pour le moment.</p>
        <Link href={backHref} className={`${secondaryButton} mx-auto mt-6 max-w-xs`}>
          Choisir une autre matière
        </Link>
      </div>
    );
  }

  if (showReview) {
    return (
      <div>
        <ol className="grid gap-4">
          {answers.map((a, i) => (
            <li key={i} className="rounded-3xl bg-white p-5 ring-1 ring-ink/10">
              <p className="text-sm font-semibold text-ink/60">Question {i + 1}</p>
              <p className="mt-1 font-display text-lg font-semibold leading-snug">{a.q}</p>
              {a.type === "qcm" ? (
                <ul className="mt-3 grid gap-2">
                  {a.choices.map((c, ci) => (
                    <li
                      key={ci}
                      className={choiceClass(
                        ci === a.correct ? "right" : ci === a.given ? "wrong" : "muted",
                      )}
                    >
                      <span className="w-5 shrink-0 text-sm font-bold">{String.fromCharCode(65 + ci)}</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 rounded-xl bg-brand-soft p-3">Ta réponse : {a.givenText || "(aucune)"}</p>
              )}
              <p className={`mt-3 font-semibold ${a.isCorrect ? "text-success" : "text-danger"}`}>
                {a.given === -1 ? "Temps écoulé" : a.isCorrect ? "Bonne réponse" : "Mauvaise réponse"}
              </p>
              {a.correctText && <p className="mt-1 text-ink/75">Réponse attendue : {a.correctText}</p>}
              {a.explain && <p className="mt-1 text-ink/75">{a.explain}</p>}
            </li>
          ))}
        </ol>
        <button type="button" onClick={() => setShowReview(false)} className={`${primaryButton} mt-6`}>
          Revenir au résultat
        </button>
      </div>
    );
  }

  if (done) {
    const correct = answers.filter((a) => a.isCorrect).length;
    const p = Math.round((correct / answers.length) * 100);
    const message =
      p >= 80 ? "Excellent travail !" : p >= 50 ? "Bien joué, continue comme ça." : "Courage, révise et réessaie.";
    return (
      <div className="mx-auto max-w-md py-6 text-center">
        <p className="font-display text-[clamp(4rem,22vw,6.5rem)] font-extrabold leading-none text-brand">{p}%</p>
        <p className="mt-3 font-display text-2xl font-bold">
          {correct} / {answers.length}
        </p>
        <p className="mt-2 text-ink/75">{message}</p>
        <p className="mt-1 text-sm text-ink/60">+ {correct * 10} points au classement</p>
        {saveError && (
          <p role="alert" className="mt-4 rounded-xl bg-danger-soft px-4 py-3 text-sm font-semibold text-danger">
            Ce résultat n&apos;a pas pu être enregistré. Vérifie ta connexion.
          </p>
        )}
        <div className="mt-8 grid gap-3">
          {mode === "exam" && (
            <button type="button" onClick={() => setShowReview(true)} className={primaryButton}>
              Voir la correction
            </button>
          )}
          <button type="button" onClick={restart} className={mode === "exam" ? secondaryButton : primaryButton}>
            Rejouer
          </button>
          <Link href="/dashboard" className={secondaryButton}>
            Retour au tableau de bord
          </Link>
        </div>
      </div>
    );
  }

  const feedback = mode === "quiz" && q.type === "qcm" && selected !== null;
  const last = idx + 1 >= questions.length;
  const shortOk = revealed && q.type === "short_answer" && isAnswerClose(typed, q.answerText);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <ProgressBar value={(idx / questions.length) * 100} />
        </div>
        <span className="text-sm font-semibold tabular-nums text-ink/60">
          {idx + 1} / {questions.length}
        </span>
        {mode === "quiz" && q.type === "qcm" && selected === null && (
          <Countdown key={idx} seconds={TIME_FOR_TYPE.qcm} onExpire={() => setSelected(-1)} />
        )}
      </div>

      <h2 className="mt-6 font-display text-[clamp(1.25rem,5vw,1.625rem)] font-semibold leading-snug">{q.q}</h2>

      {q.type === "qcm" ? (
        <ul className="mt-5 grid gap-2.5">
          {q.choices.map((c, i) => {
            const state = feedback
              ? i === q.answer
                ? "right"
                : i === selected
                  ? "wrong"
                  : "muted"
              : i === selected
                ? "picked"
                : "idle";
            return (
              <li key={`${idx}-${i}`}>
                <button
                  type="button"
                  disabled={feedback}
                  onClick={() => setSelected(i)}
                  className={choiceClass(state)}
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-soft text-sm font-bold text-brand">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="min-w-0 flex-1">{c}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="mt-5">
          <label className="block text-sm font-semibold">
            Ta réponse
            <textarea
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              readOnly={revealed}
              rows={q.type === "essay" ? 8 : 2}
              className="mt-1.5 w-full rounded-xl border border-ink/20 bg-white px-4 py-3 text-base font-normal"
            />
          </label>
          {revealed && (
            <div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-ink/10">
              {q.type === "short_answer" && (
                <p className={`font-semibold ${shortOk ? "text-success" : "text-danger"}`}>
                  {shortOk ? "Bonne réponse" : "Pas tout à fait"}
                </p>
              )}
              <p className="mt-1">
                <strong>{q.type === "essay" ? "Modèle de réponse : " : "Réponse attendue : "}</strong>
                {q.answerText}
              </p>
              {q.explain && <p className="mt-2 text-ink/75">{q.explain}</p>}
            </div>
          )}
        </div>
      )}

      {feedback && (
        <div aria-live="polite" className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-ink/10">
          <p className={`font-semibold ${selected === q.answer ? "text-success" : "text-danger"}`}>
            {selected === -1 ? "Temps écoulé" : selected === q.answer ? "Bonne réponse" : "Mauvaise réponse"}
          </p>
          {q.explain && <p className="mt-1 text-ink/75">{q.explain}</p>}
        </div>
      )}

      <div className="mt-6 grid gap-3">
        {q.type === "qcm" && (
          <button
            type="button"
            disabled={selected === null}
            onClick={() => commit(selected === q.answer, selected)}
            className={primaryButton}
          >
            {last ? "Terminer" : "Suivant"}
          </button>
        )}
        {q.type === "short_answer" &&
          (revealed ? (
            <button type="button" onClick={() => commit(shortOk, null, typed.trim())} className={primaryButton}>
              {last ? "Terminer" : "Suivant"}
            </button>
          ) : (
            <button type="button" disabled={!typed.trim()} onClick={() => setRevealed(true)} className={primaryButton}>
              Valider
            </button>
          ))}
        {q.type === "essay" &&
          (revealed ? (
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => commit(false, null, typed.trim())} className={secondaryButton}>
                À revoir
              </button>
              <button type="button" onClick={() => commit(true, null, typed.trim())} className={primaryButton}>
                J&apos;avais bon
              </button>
            </div>
          ) : (
            <button type="button" disabled={!typed.trim()} onClick={() => setRevealed(true)} className={primaryButton}>
              Voir la correction
            </button>
          ))}
      </div>
    </div>
  );
}
