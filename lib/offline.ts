"use client";

import { createClient } from "@/lib/supabase/client";

// Mode hors-ligne : banque de questions locale + file d'attente des résultats.
// Les clés sont partagées avec public/hors-ligne.html (même format, ne pas renommer).
const BANK_PREFIX = "ex:bank:";
const QUEUE_KEY = "ex:queue";
const UID_KEY = "ex:uid";
const PREFETCH_KEY = "ex:prefetch";
const BANK_MAX = 60;
const PREFETCH_EVERY_MS = 3 * 24 * 3600 * 1000;

export type OfflineQuestion = {
  id: string;
  q: string;
  type: "qcm";
  choices: string[];
  answer: number;
  answerText: string;
  explain: string;
  chapterTitle: string | null;
};

type Bank = { name: string; level: string; questions: OfflineQuestion[] };

export type QueuedResult = {
  id: string;
  userId: string;
  result: Record<string, unknown>;
  attempts: Record<string, unknown>[];
};

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Stockage plein ou indisponible : le mode hors-ligne est un bonus, on ignore.
  }
}

export const setUid = (uid: string) => write(UID_KEY, uid);
export const getUid = () => read<string | null>(UID_KEY, null);

export function addToBank(
  subject: string,
  meta: { name: string; level: string },
  questions: OfflineQuestion[],
) {
  const key = BANK_PREFIX + subject;
  const bank = read<Bank>(key, { ...meta, questions: [] });
  const fresh = new Set(questions.map((q) => q.id));
  const merged = [...questions, ...bank.questions.filter((q) => !fresh.has(q.id))].slice(0, BANK_MAX);
  write(key, { ...meta, questions: merged });
}

export function pickFromBank(subject: string, count: number, chapter?: string): OfflineQuestion[] {
  const bank = read<Bank | null>(BANK_PREFIX + subject, null);
  const list = (bank?.questions ?? []).filter((q) => !chapter || (q.chapterTitle ?? "Général") === chapter);
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list.slice(0, count);
}

export function enqueueResult(item: QueuedResult) {
  write(QUEUE_KEY, [...read<QueuedResult[]>(QUEUE_KEY, []), item]);
}

let flushing = false;

// Envoie les résultats gardés hors-ligne. Seuls ceux du compte connecté partent
// (un autre élève sur le même téléphone ne reçoit pas les points du précédent).
export async function flushQueue(userId: string) {
  if (flushing || !navigator.onLine) return;
  flushing = true;
  try {
    const supabase = createClient();
    for (const item of read<QueuedResult[]>(QUEUE_KEY, [])) {
      if (item.userId !== userId) continue;
      const { error, status } = await supabase.from("results").insert(item.result);
      if (error && status === 0) break; // toujours pas de réseau : on réessaiera
      // 23505 : déjà enregistré lors d'un envoi précédent. Tout autre rejet du serveur
      // est définitif : le réessayer ne servirait à rien.
      if (!error && item.attempts.length) await supabase.from("attempts").insert(item.attempts);
      write(
        QUEUE_KEY,
        read<QueuedResult[]>(QUEUE_KEY, []).filter((x) => x.id !== item.id),
      );
    }
  } finally {
    flushing = false;
  }
}

type PickedRow = {
  id: string;
  question: string;
  choices: string[] | null;
  answer: number | null;
  answer_text: string | null;
  explain: string | null;
  chapter_title: string | null;
};

export function toOfflineQuestion(r: PickedRow): OfflineQuestion {
  return {
    id: r.id,
    q: r.question,
    type: "qcm",
    choices: r.choices ?? [],
    answer: r.answer ?? 0,
    answerText: r.answer_text ?? "",
    explain: r.explain ?? "",
    chapterTitle: r.chapter_title,
  };
}

// Télécharge des questions de chaque matière pour jouer sans connexion.
// Au plus une fois tous les 3 jours, jamais en mode économie de données.
export async function prefetchBank(subjects: { id: string; name: string }[], level: string) {
  const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
  if (saveData || !navigator.onLine) return;
  const last = read<number>(PREFETCH_KEY, 0);
  if (Date.now() - last < PREFETCH_EVERY_MS) return;
  const supabase = createClient();
  let ok = 0;
  for (const s of subjects) {
    const { data, error } = await supabase.rpc("pick_questions", {
      p_subject: s.id,
      p_type: "qcm",
      p_chapter: null,
      p_limit: 30,
    });
    if (error || !data) continue;
    const list = (data as PickedRow[]).map(toOfflineQuestion);
    if (list.length) {
      addToBank(s.id, { name: s.name, level }, list);
      ok++;
    }
  }
  if (ok) write(PREFETCH_KEY, Date.now());
}
