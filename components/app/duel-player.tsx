"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Countdown, choiceClass, primaryButton, secondaryButton } from "@/components/app/ui";
import { subjectName } from "@/lib/content";
import { duelError, type DuelRow } from "@/lib/realtime";
import { hashCode, pickSeeded, shuffledOrder } from "@/lib/seeded";
import { createClient } from "@/lib/supabase/client";

type Qcm = { q: string; choices: string[]; answer: number };
type DuelAnswer = { q: string; given: number };
const TIME_PER_QUESTION = 15;

export function DuelPlayer({ id, me }: { id: string; me: string }) {
  const router = useRouter();
  const [duel, setDuel] = useState<DuelRow | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [names, setNames] = useState<Record<string, string>>({});
  const [rawQs, setRawQs] = useState<Qcm[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [sel, setSel] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<DuelAnswer[]>([]);
  const [finished, setFinished] = useState(false);
  const [sendErr, setSendErr] = useState(false);
  const [canClaim, setCanClaim] = useState(false);
  const [message, setMessage] = useState("");
  const locked = useRef(false);

  useEffect(() => {
    const supabase = createClient();
    let alive = true;
    supabase
      .from("duels")
      .select("*")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => {
        if (!alive) return;
        if (!data) return setState("error");
        const d = data as DuelRow;
        setDuel(d);
        setState("ready");
        supabase
          .from("profiles")
          .select("id,name")
          .in("id", [d.challenger, d.opponent])
          .then(({ data: ps }) => {
            if (alive) setNames(Object.fromEntries((ps ?? []).map((p) => [p.id, p.name])));
          });
      });
    const ch = supabase
      .channel("duel-" + id)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "duels", filter: `id=eq.${id}` },
        (p) => setDuel(p.new as DuelRow),
      )
      .subscribe();
    return () => {
      alive = false;
      supabase.removeChannel(ch);
    };
  }, [id]);

  const subjectId = duel?.subject_id;
  const seed = duel?.seed;

  // Même banque, même ordre et même tirage que l'app : les deux joueurs ont les mêmes questions.
  useEffect(() => {
    if (!subjectId || seed === undefined) return;
    let alive = true;
    let query = createClient()
      .from("questions")
      .select("question, choices, answer")
      .eq("type", "qcm")
      .eq("active", true);
    if (subjectId !== "mixte") query = query.eq("subject_id", subjectId);
    query.order("id", { ascending: true }).then(({ data }) => {
      if (!alive) return;
      const pool: Qcm[] = (data ?? []).map((r) => ({
        q: r.question as string,
        choices: r.choices as string[],
        answer: r.answer as number,
      }));
      setRawQs(pickSeeded(pool, seed, 5));
    });
    return () => {
      alive = false;
    };
  }, [subjectId, seed]);

  // Ordre des choix propre à chaque joueur ; `order` permet de renvoyer l'index d'origine.
  const view = useMemo(() => {
    if (!rawQs || seed === undefined) return [];
    const mySeed = seed + hashCode(me);
    return rawQs.map((q, i) => {
      const order = shuffledOrder(q.choices.length, mySeed + i * 7919);
      return { q: q.q, order, choices: order.map((o) => q.choices[o]), answer: order.indexOf(q.answer) };
    });
  }, [rawQs, seed, me]);

  const mine = duel?.challenger === me;
  const myDone = duel ? (mine ? duel.challenger_done : duel.opponent_done) : false;
  const waiting = finished || myDone;
  const duelId = duel?.id;
  const status = duel?.status;

  // Une fois ma partie finie : on surveille la fin du duel, puis on autorise à clôturer.
  useEffect(() => {
    if (!waiting || !duelId || status !== "accepted") return;
    const supabase = createClient();
    const poll = setInterval(async () => {
      const { data } = await supabase.from("duels").select("*").eq("id", duelId).maybeSingle();
      if (data) setDuel(data as DuelRow);
    }, 5000);
    const claim = setTimeout(() => setCanClaim(true), 95000);
    return () => {
      clearInterval(poll);
      clearTimeout(claim);
    };
  }, [waiting, duelId, status]);

  if (state === "loading") return <p className="py-16 text-center text-ink/70">Chargement du duel…</p>;
  if (state === "error" || !duel) {
    return (
      <div className="py-12 text-center">
        <p className="text-ink/75">Ce duel est introuvable.</p>
        <Link href="/dashboard/communaute" className={`${secondaryButton} mx-auto mt-6 max-w-xs`}>
          Retour à la communauté
        </Link>
      </div>
    );
  }

  const oppId = mine ? duel.opponent : duel.challenger;
  const oppName = names[oppId] ?? "…";
  const oppScore = mine ? duel.opponent_score : duel.challenger_score;
  const oppDone = mine ? duel.opponent_done : duel.challenger_done;
  const myScore = Math.max(score, mine ? duel.challenger_score : duel.opponent_score);
  const iForfeited = mine ? duel.challenger_forfeit : duel.opponent_forfeit;
  const theyForfeited = mine ? duel.opponent_forfeit : duel.challenger_forfeit;

  const send = async (list: DuelAnswer[], done: boolean) => {
    const { data, error } = await createClient().rpc("duel_progress", {
      p_id: duel.id,
      p_answers: list,
      p_done: done,
    });
    if (data && !error) setDuel(data as DuelRow);
    return !error;
  };

  const pick = (i: number) => {
    const q = view[idx];
    if (locked.current || waiting || !q) return;
    locked.current = true;
    setSel(i);
    if (i === q.answer) setScore((s) => s + 1);
    // Le serveur compare à l'index d'origine de la bonne réponse ; -1 = temps écoulé.
    const next = [...answers, { q: q.q, given: i < 0 ? -1 : q.order[i] }];
    setAnswers(next);
    const last = idx + 1 >= view.length;
    send(next, last).then((ok) => {
      if (!ok && last) setSendErr(true);
    });
    setTimeout(() => {
      if (last) setFinished(true);
      else {
        setIdx(idx + 1);
        setSel(null);
      }
      locked.current = false;
    }, 800);
  };

  const retry = async () => {
    if (await send(answers, true)) setSendErr(false);
  };

  const claim = async () => {
    const { data, error } = await createClient().rpc("duel_claim", { p_id: duel.id });
    if (error) setMessage(duelError(error.message));
    else if (data) setDuel(data as DuelRow);
  };

  const leave = async () => {
    const ok = window.confirm(
      `Quitter le duel ? Tu abandonnes la partie : ${oppName} gagnera et tu perdras des points au classement.`,
    );
    if (!ok) return;
    await createClient().rpc("duel_forfeit", { p_id: duel.id });
    router.push("/dashboard/communaute");
  };

  const scoreboard = (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-3xl bg-ink p-5 text-white">
      <div>
        <p className="text-sm text-white/70">Toi</p>
        <p className="font-display text-4xl font-extrabold">{myScore}</p>
      </div>
      <p className="text-sm font-semibold text-white/60">{subjectName(duel.subject_id)}</p>
      <div className="text-right">
        <p className="truncate text-sm text-white/70">{oppName}</p>
        <p className="font-display text-4xl font-extrabold">{oppScore}</p>
      </div>
    </div>
  );

  const backLink = (
    <Link href="/dashboard/communaute" className={`${secondaryButton} mt-6`}>
      Retour à la communauté
    </Link>
  );

  if (duel.status === "pending") {
    return (
      <div className="mx-auto max-w-md py-10 text-center">
        <p className="font-display text-2xl font-bold">En attente de {oppName}…</p>
        <p className="mt-2 text-ink/70">Le duel démarre dès que ton adversaire accepte.</p>
        {backLink}
      </div>
    );
  }

  if (duel.status === "declined" || duel.status === "cancelled") {
    return (
      <div className="mx-auto max-w-md py-10 text-center">
        <p className="font-display text-2xl font-bold">
          {duel.status === "declined" ? "Défi refusé" : "Duel annulé"}
        </p>
        {backLink}
      </div>
    );
  }

  if (duel.status === "finished") {
    const title = iForfeited
      ? "Tu as abandonné"
      : theyForfeited
        ? `${oppName} a abandonné, tu gagnes !`
        : duel.winner === me
          ? "Victoire !"
          : duel.winner === null
            ? "Match nul"
            : "Défaite";
    return (
      <div className="mx-auto max-w-md py-4">
        <p className="mb-5 text-center font-display text-[clamp(2rem,9vw,3rem)] font-extrabold leading-tight">
          {title}
        </p>
        {scoreboard}
        {duel.winner === me && <p className="mt-4 text-center text-ink/70">+ 30 points au classement</p>}
        {backLink}
      </div>
    );
  }

  if (waiting) {
    return (
      <div className="mx-auto max-w-md py-4">
        {scoreboard}
        <p className="mt-6 text-center font-display text-xl font-bold">
          {oppDone ? "Calcul du résultat…" : `${oppName} joue encore…`}
        </p>
        {sendErr && (
          <button type="button" onClick={retry} className={`${primaryButton} mt-4`}>
            Renvoyer mes réponses
          </button>
        )}
        {canClaim && !sendErr && (
          <button type="button" onClick={claim} className={`${primaryButton} mt-4`}>
            Terminer le duel
          </button>
        )}
        {message && (
          <p role="alert" className="mt-3 text-center text-sm font-semibold text-danger">
            {message}
          </p>
        )}
      </div>
    );
  }

  if (!rawQs) return <p className="py-16 text-center text-ink/70">Chargement des questions…</p>;
  if (!view.length) {
    return (
      <div className="py-12 text-center">
        <p className="text-ink/75">Aucune question disponible pour ce duel.</p>
        {backLink}
      </div>
    );
  }

  const q = view[idx];

  return (
    <div className="mx-auto max-w-2xl">
      {scoreboard}
      <div className="mt-5 flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-ink/60">
          Question {idx + 1} / {view.length}
        </span>
        {sel === null && <Countdown key={idx} seconds={TIME_PER_QUESTION} onExpire={() => pick(-1)} />}
      </div>
      <h2 className="mt-4 font-display text-[clamp(1.25rem,5vw,1.625rem)] font-semibold leading-snug">{q.q}</h2>
      <ul className="mt-5 grid gap-2.5">
        {q.choices.map((c, i) => {
          const stateClass =
            sel === null ? "idle" : i === q.answer ? "right" : i === sel ? "wrong" : "muted";
          return (
            <li key={`${idx}-${i}`}>
              <button type="button" disabled={sel !== null} onClick={() => pick(i)} className={choiceClass(stateClass)}>
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-soft text-sm font-bold text-brand">
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="min-w-0 flex-1">{c}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <button type="button" onClick={leave} className="mt-6 min-h-11 text-sm font-semibold text-danger underline underline-offset-4">
        Quitter le duel
      </button>
    </div>
  );
}
