"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ReportQuestion } from "@/components/app/report-question";
import { Countdown, ProgressBar, choiceClass, primaryButton, secondaryButton } from "@/components/app/ui";
import { isAnswerClose } from "@/lib/fuzzy";
import { addToBank, enqueueResult, getUid, pickFromBank, toOfflineQuestion } from "@/lib/offline";
import { shuffle } from "@/lib/seeded";
import { playFeedback } from "@/lib/sound";
import type { Annale } from "@/lib/annales";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/components/i18n-provider";

export type QuizMode = "quiz" | "exam" | "short" | "essay";
type QType = "qcm" | "short_answer" | "essay";

type Question = {
  id: string;
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

type PickedRow = {
  id: string;
  type: QType;
  question: string;
  choices: string[] | null;
  answer: number | null;
  answer_text: string | null;
  explain: string | null;
  chapter_title: string | null;
};

// crypto.randomUUID n'existe pas sur les vieux navigateurs (Chrome < 92, Safari < 15.4).
function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

const TIME_FOR_TYPE: Record<QType, number> = { qcm: 20, short_answer: 45, essay: 90 };
const WANTED: Record<QuizMode, QType> = { quiz: "qcm", exam: "qcm", short: "short_answer", essay: "essay" };

type Props = {
  subject: string;
  subjectName: string;
  mode: QuizMode;
  level: string;
  backHref: string;
  // Titre du chapitre choisi (« Général » = questions sans chapitre) ; absent = toute la matière.
  chapter?: string;
  // Publicités rendues côté serveur : avant la première question, et sur l'écran de résultat.
  beforeAd?: ReactNode;
  afterAd?: ReactNode;
  // Partage WhatsApp du résultat : lien d'inscription et code de parrainage de l'élève.
  shareUrl?: string;
  referralCode?: string | null;
  // Simulation d'une annale : toutes ses questions, dans l'ordre de l'épreuve (QCM, puis réponses courtes, puis rédactions).
  annale?: Annale;
};

const TYPE_ORDER: Record<QType, number> = { qcm: 0, short_answer: 1, essay: 2 };

export function QuizPlayer({ subject, subjectName, mode, level, backHref, chapter, beforeAd, afterAd, shareUrl, referralCode, annale }: Props) {
  const t = useT();
  const [pool, setPool] = useState<Question[] | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [typed, setTyped] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [answers, setAnswers] = useState<DetailedAnswer[]>([]);
  const [done, setDone] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [savedOffline, setSavedOffline] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [round, setRound] = useState(0);
  const startedAt = useRef(0);

  const pick = (all: Question[]) => {
    const shuffled = annale ? all : shuffle(all);
    setQuestions(mode === "quiz" ? shuffled.slice(0, 5) : shuffled);
    startedAt.current = Date.now();
    // Pour mesurer le décrochage (quiz commencés vs terminés). Les fiches ont leur
    // propre composant (flashcards.tsx), jamais rendu ici.
    if (all.length) {
      createClient().from("events").insert({ kind: "quiz_start", subject_id: subject }).then(() => {});
    }
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      const supabase = createClient();
      let list: Question[];

      if (mode === "quiz") {
        // Quiz rapide : le serveur tire 5 questions au hasard, rien d'autre n'est téléchargé.
        const { data, error } = await supabase.rpc("pick_questions", {
          p_subject: subject,
          p_type: "qcm",
          p_chapter: chapter ?? null,
          p_limit: 5,
        });
        if (error) {
          console.error("pick_questions failed:", error.code, error.message);
          // Sans réseau : questions déjà téléchargées sur le téléphone.
          list = pickFromBank(subject, 5, chapter);
        } else {
          const rows = (data as PickedRow[] | null) ?? [];
          list = rows.map((r) => ({
            id: r.id,
            q: r.question,
            type: r.type,
            choices: r.choices ?? [],
            answer: r.answer ?? 0,
            answerText: r.answer_text ?? "",
            explain: r.explain ?? "",
            chapterTitle: r.chapter_title,
          }));
          // On garde ces questions pour pouvoir rejouer hors connexion.
          addToBank(subject, { name: subjectName, level }, rows.filter((r) => r.type === "qcm").map(toOfflineQuestion));
        }
      } else {
        // Simulation, réponse courte, rédaction : toutes les questions du type sont jouées.
        // Annale : toutes les questions de l'épreuve, quel que soit leur type.
        let query = supabase
          .from("questions")
          .select("id, chapter_id, type, question, choices, answer, answer_text, explain")
          .eq("subject_id", subject)
          .eq("active", true);
        query = annale ? query.eq("year", annale.year).eq("session", annale.session) : query.eq("type", WANTED[mode]);
        const [qRes, cRes] = await Promise.all([
          query.order("id", { ascending: true }),
          supabase.from("chapters").select("id, title").eq("subject_id", subject),
        ]);
        if (qRes.error) {
          console.error("questions query failed:", qRes.error.code, qRes.error.message);
          list = [];
        } else {
          const titles = new Map((cRes.data ?? []).map((c) => [c.id as string, c.title as string]));
          list = (qRes.data ?? [])
            .map((r) => ({
              id: r.id as string,
              q: r.question as string,
              type: r.type as QType,
              choices: (r.choices as string[] | null) ?? [],
              answer: (r.answer as number | null) ?? 0,
              answerText: (r.answer_text as string | null) ?? "",
              explain: (r.explain as string | null) ?? "",
              chapterTitle: r.chapter_id ? (titles.get(r.chapter_id) ?? null) : null,
            }))
            .filter((q) => !chapter || (q.chapterTitle ?? "Général") === chapter)
            .sort((a, b) => (annale ? TYPE_ORDER[a.type] - TYPE_ORDER[b.type] : 0));
        }
      }

      if (!alive) return;
      setPool(list);
      pick(list);
    })();
    return () => {
      alive = false;
    };
    // pick ne dépend que du mode, déjà dans la liste ; `round` relance un tirage serveur.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject, mode, chapter, round, annale?.year, annale?.session]);

  const save = async (all: DetailedAnswer[]) => {
    const supabase = createClient();
    const correct = all.filter((a) => a.isCorrect).length;
    const row = {
      id: newId(),
      level,
      subject_id: subject,
      subject_name: subjectName,
      mode,
      correct,
      total: all.length,
      answers: all,
      duration_sec: Math.round((Date.now() - startedAt.current) / 1000),
    };
    const attempts = all.map((a, i) => ({
      subject_id: subject,
      skill: "concepts",
      correct: a.isCorrect,
      chapter: questions[i]?.chapterTitle ?? null,
      subject_name: subjectName,
    }));
    const [result] = await Promise.all([
      supabase.from("results").insert(row),
      supabase.from("attempts").insert(attempts),
    ]);
    // status 0 = la requête n'a pas pu partir (pas de réseau) : on garde le résultat
    // sur le téléphone, il est envoyé dès que la connexion revient (même id = sans doublon).
    const uid = getUid();
    if (result.error && result.status === 0 && uid) {
      enqueueResult({ id: row.id, userId: uid, result: row, attempts });
      setSavedOffline(true);
      return;
    }
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
    if (mode === "quiz") {
      // Nouveau tirage côté serveur.
      setPool(null);
      setRound((r) => r + 1);
    } else if (pool) pick(pool);
    setIdx(0);
    setSelected(null);
    setTyped("");
    setRevealed(false);
    setAnswers([]);
    setDone(false);
    setSaveError(false);
    setSavedOffline(false);
    setShowReview(false);
  };

  if (pool === null) return <p className="py-16 text-center text-ink/70">{t("Chargement des questions…")}</p>;

  if (!questions.length) {
    return (
      <div className="py-12 text-center">
        <p className="text-ink/75">{t("Aucune question de ce type pour cette matière pour le moment.")}</p>
        <Link href={backHref} className={`${secondaryButton} mx-auto mt-6 max-w-xs`}>
          {t("Retour")}
        </Link>
      </div>
    );
  }

  if (showReview) {
    return (
      <div>
        <ol className="grid gap-4">
          {answers.map((a, i) => (
            <li key={i} className="rounded-3xl bg-surface p-5 ring-1 ring-ink/10">
              <p className="text-sm font-semibold text-ink/60">{t("Question ")}{i + 1}</p>
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
                <p className="mt-3 rounded-xl bg-brand-soft p-3">{t("Ta réponse : ")}{a.givenText || t("(aucune)")}</p>
              )}
              <p className={`mt-3 font-semibold ${a.isCorrect ? "text-success-fg" : "text-danger-fg"}`}>
                {a.given === -1 ? t("Temps écoulé") : a.isCorrect ? t("Bonne réponse") : t("Mauvaise réponse")}
              </p>
              {a.correctText && <p className="mt-1 text-ink/75">{t("Réponse attendue : ")}{a.correctText}</p>}
              {a.explain && <p className="mt-1 text-ink/75">{a.explain}</p>}
            </li>
          ))}
        </ol>
        <button type="button" onClick={() => setShowReview(false)} className={`${primaryButton} mt-6`}>
          {t("Revenir au résultat")}
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
        <p className="font-display text-[clamp(4rem,22vw,6.5rem)] font-extrabold leading-none text-brand-fg">{p}%</p>
        <p className="mt-3 font-display text-2xl font-bold">
          {correct} / {answers.length}
        </p>
        <p className="mt-2 text-ink/75">{t(message)}</p>
        <p className="mt-1 text-sm text-ink/60">+ {correct * 10}{t(" points au classement")}</p>
        {saveError && (
          <p role="alert" className="mt-4 rounded-xl bg-danger-soft px-4 py-3 text-sm font-semibold text-danger-fg">
            {t("Ce résultat n'a pas pu être enregistré. Vérifie ta connexion.")}
          </p>
        )}
        {savedOffline && (
          <p className="mt-4 rounded-xl bg-surface px-4 py-3 text-sm font-semibold ring-1 ring-ink/10">
            {t("Pas de connexion : ton résultat est gardé sur ton téléphone et sera envoyé dès que tu seras en ligne.")}
          </p>
        )}
        {afterAd}
        <div className="mt-8 grid gap-3">
          {mode === "exam" && (
            <button type="button" onClick={() => setShowReview(true)} className={primaryButton}>
              {t("Voir la correction")}
            </button>
          )}
          <button type="button" onClick={restart} className={mode === "exam" ? secondaryButton : primaryButton}>
            {t("Rejouer")}
          </button>
          {shareUrl && (
            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                t("J'ai eu {score} en {subjectName} sur Examplay. Prépare l'examen d'État avec moi : {shareUrl}", {
                  score: `${correct}/${answers.length}`,
                  subjectName,
                  shareUrl,
                }) + (referralCode ? `\n${t("Mon code de parrainage : {referralCode}", { referralCode })}` : ""),
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className={secondaryButton}
            >
              {t("Partager sur WhatsApp")}
            </a>
          )}
          <Link href="/dashboard" className={secondaryButton}>
            {t("Retour au tableau de bord")}
          </Link>
        </div>
      </div>
    );
  }

  const feedback = mode === "quiz" && q.type === "qcm" && selected !== null;
  const last = idx + 1 >= questions.length;
  // Annale : les réponses courtes sont souvent longues, l'élève compare lui-même avec le corrigé.
  const selfGraded = q.type === "essay" || (!!annale && q.type === "short_answer");
  const shortOk = revealed && q.type === "short_answer" && !selfGraded && isAnswerClose(typed, q.answerText);

  return (
    <div className="mx-auto max-w-2xl">
      {idx === 0 && answers.length === 0 && beforeAd}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <ProgressBar value={(idx / questions.length) * 100} />
        </div>
        <span className="text-sm font-semibold tabular-nums text-ink/60">
          {idx + 1} / {questions.length}
        </span>
        {mode === "quiz" && q.type === "qcm" && selected === null && (
          // +6 s sur la première question : la publicité d'avant-quiz peut recouvrir l'écran quelques secondes.
          <Countdown key={idx} seconds={TIME_FOR_TYPE.qcm + (idx === 0 ? 6 : 0)} onExpire={() => {
              setSelected(-1);
              if (mode === "quiz") playFeedback(false);
            }} />
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
                  onClick={() => {
                    setSelected(i);
                    if (mode === "quiz") playFeedback(i === q.answer);
                  }}
                  className={choiceClass(state)}
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-soft text-sm font-bold text-brand-fg">
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
            {t("Ta réponse")}
            <textarea
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              readOnly={revealed}
              rows={q.type === "essay" ? 8 : 2}
              className="mt-1.5 w-full rounded-xl border border-ink/20 bg-surface px-4 py-3 text-base font-normal"
            />
          </label>
          {revealed && (
            <div className="mt-4 rounded-2xl bg-surface p-4 ring-1 ring-ink/10">
              {q.type === "short_answer" && !selfGraded && (
                <p className={`font-semibold ${shortOk ? "text-success-fg" : "text-danger-fg"}`}>
                  {shortOk ? t("Bonne réponse") : t("Pas tout à fait")}
                </p>
              )}
              <p className="mt-1">
                <strong>{q.type === "essay" ? t("Modèle de réponse : ") : t("Réponse attendue : ")}</strong>
                {q.answerText}
              </p>
              {q.explain && <p className="mt-2 text-ink/75">{q.explain}</p>}
            </div>
          )}
        </div>
      )}

      {feedback && (
        <div aria-live="polite" className="mt-4 rounded-2xl bg-surface p-4 ring-1 ring-ink/10">
          <p className={`font-semibold ${selected === q.answer ? "text-success-fg" : "text-danger-fg"}`}>
            {selected === -1 ? t("Temps écoulé") : selected === q.answer ? t("Bonne réponse") : t("Mauvaise réponse")}
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
            {last ? t("Terminer") : t("Suivant")}
          </button>
        )}
        {q.type === "short_answer" &&
          !selfGraded &&
          (revealed ? (
            <button type="button" onClick={() => commit(shortOk, null, typed.trim())} className={primaryButton}>
              {last ? t("Terminer") : t("Suivant")}
            </button>
          ) : (
            <button
              type="button"
              disabled={!typed.trim()}
              onClick={() => {
                setRevealed(true);
                if (mode === "quiz") playFeedback(isAnswerClose(typed, q.answerText));
              }}
              className={primaryButton}
            >
              {t("Valider")}
            </button>
          ))}
        {selfGraded &&
          (revealed ? (
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => commit(false, null, typed.trim())} className={secondaryButton}>
                {t("À revoir")}
              </button>
              <button type="button" onClick={() => commit(true, null, typed.trim())} className={primaryButton}>
                {t("J'avais bon")}
              </button>
            </div>
          ) : (
            <button type="button" disabled={!typed.trim()} onClick={() => setRevealed(true)} className={primaryButton}>
              {t("Voir la correction")}
            </button>
          ))}
      </div>

      <ReportQuestion key={q.id} questionId={q.id} />
    </div>
  );
}
