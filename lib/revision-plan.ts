import { EXAM_CALENDAR } from "@/lib/exam-dates";
import type { Subject } from "@/lib/content";

// Même logique que l'app mobile (src/lib/revisionPlan.ts) : les épreuves proches et les
// matières où l'élève réussit moins bien passent en premier.

export type AttemptRow = { subject_id: string; chapter: string | null; correct: boolean };
export type PlanTask = { subject: Subject | null; label: string; chapter: string | null };
export type PlanDay = { date: Date; tasks: PlanTask[] };
export type Plan = { daysLeft: number; firstExam: string; days: PlanDay[] };

const MIN_ANSWERS = 5;
const WEAK_BELOW = 60;
const DAY = 86400000;

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

const ALIASES: Record<string, string[]> = {
  svt: ["biologie", "geologie"],
  "histoire et geo": ["histoire", "geographie"],
};

// Date du jour en Haïti (le serveur tourne en UTC).
export function haitiToday(now = new Date()): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Port-au-Prince",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const [y, m, d] = parts.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function buildPlan(
  level: string,
  subjects: Subject[],
  rows: AttemptRow[],
  today: Date,
  horizon = 7,
  perDay = 2,
): Plan | null {
  const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const upcoming = (EXAM_CALENDAR[level] ?? [])
    .map((s) => ({ ...s, ts: new Date(s.date + "T00:00:00").getTime() }))
    .filter((s) => s.ts >= t0)
    .sort((a, b) => a.ts - b.ts);
  if (!upcoming.length) return null;

  const bySubject: Record<string, { correct: number; total: number }> = {};
  for (const r of rows) {
    const b = (bySubject[r.subject_id] ??= { correct: 0, total: 0 });
    b.total++;
    if (r.correct) b.correct++;
  }
  const pctOf = (id: string) => {
    const b = bySubject[id];
    return b && b.total >= MIN_ANSWERS ? (b.correct / b.total) * 100 : null;
  };

  const units = upcoming.map((s) => {
    const key = norm(s.label);
    const aliases = ALIASES[key] ?? [];
    const matched = subjects.filter((sub) => {
      const n = norm(sub.name);
      return n.length > 0 && (key.includes(n) || n.includes(key) || aliases.some((a) => n.includes(a)));
    });
    const subject = [...matched].sort((a, b) => (pctOf(a.id) ?? 50) - (pctOf(b.id) ?? 50))[0] ?? null;
    const pct = subject ? pctOf(subject.id) : null;
    const weakness = pct === null ? 0.5 : 1 - pct / 100;
    const daysLeft = Math.max(1, Math.ceil((s.ts - t0) / DAY));

    const chapters: Record<string, { correct: number; total: number }> = {};
    if (subject) {
      for (const r of rows) {
        if (r.subject_id !== subject.id || !r.chapter) continue;
        const c = (chapters[r.chapter] ??= { correct: 0, total: 0 });
        c.total++;
        if (r.correct) c.correct++;
      }
    }
    const weakChapters = Object.entries(chapters)
      .map(([name, c]) => ({ name, pct: (c.correct / c.total) * 100, total: c.total }))
      .filter((c) => c.total >= MIN_ANSWERS && c.pct < WEAK_BELOW)
      .sort((a, b) => a.pct - b.pct)
      .map((c) => c.name);

    return { label: s.label, subject, weakChapters, score: (0.2 + weakness) * (1 + 60 / daysLeft), picked: 0 };
  });

  const days: PlanDay[] = [];
  const count = Math.max(1, Math.min(horizon, Math.ceil((upcoming[0].ts - t0) / DAY) + 1));
  for (let d = 0; d < count; d++) {
    const used = new Set<number>();
    const tasks: PlanTask[] = [];
    for (let slot = 0; slot < Math.min(perDay, units.length); slot++) {
      let best = -1;
      units.forEach((u, i) => {
        if (used.has(i)) return;
        if (best < 0 || u.score / (1 + u.picked) > units[best].score / (1 + units[best].picked)) best = i;
      });
      if (best < 0) break;
      used.add(best);
      const u = units[best];
      const chapter = u.weakChapters.length ? u.weakChapters[u.picked % u.weakChapters.length] : null;
      u.picked++;
      tasks.push({ subject: u.subject, label: u.label, chapter });
    }
    days.push({ date: new Date(t0 + d * DAY), tasks });
  }

  return { daysLeft: Math.ceil((upcoming[0].ts - t0) / DAY), firstExam: upcoming[0].label, days };
}
