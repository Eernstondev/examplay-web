import { coef, type Subject } from "@/lib/content";

export type Result = {
  id: string;
  subjectId: string;
  subjectName: string;
  mode: "quiz" | "exam" | "short" | "essay";
  correct: number;
  total: number;
  date: number;
  durationSec?: number;
};

export type DuelSummary = { id: string; opp: string; subject: string; me: number; them: number; date: number };

export const pct = (r: Result) => (r.total ? Math.round((r.correct / r.total) * 100) : 0);

// Moyenne des 5 derniers quiz de la matière (résultats triés du plus récent au plus ancien).
export function subjectProgress(results: Result[], subjectId: string): number {
  const list = results.filter((r) => r.subjectId === subjectId).slice(0, 5);
  if (!list.length) return 0;
  return Math.round(list.reduce((a, r) => a + pct(r), 0) / list.length);
}

export function globalProgress(results: Result[], subjects: Subject[]): number {
  let sum = 0;
  let w = 0;
  subjects.forEach((s) => {
    sum += subjectProgress(results, s.id) * coef(s);
    w += coef(s);
  });
  return w ? Math.round(sum / w) : 0;
}

// Jour, heure et jour de semaine en heure d'Haïti (le serveur tourne en UTC).
const haitiFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Port-au-Prince",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  hourCycle: "h23",
  weekday: "short",
});

export function haitiTime(ts: number): { day: string; hour: number; weekend: boolean } {
  const parts = Object.fromEntries(haitiFormat.formatToParts(ts).map((p) => [p.type, p.value]));
  return {
    day: `${parts.year}-${parts.month}-${parts.day}`,
    hour: Number(parts.hour),
    weekend: parts.weekday === "Sat" || parts.weekday === "Sun",
  };
}
