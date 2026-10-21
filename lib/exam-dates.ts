// Calendrier des épreuves 2027 (confirmé) : 9e AF du 28 juin au 1er juillet, NS4 du 12 au 15 juillet.
// RAW_CALENDAR garde l'ordre des matières du calendrier MENFP 2026 ; chaque date est décalée de
// 52 semaines (même jour de la semaine, les épreuves commencent un lundi).
const BASE_ANNEE = 2026;
const ANNEE_EXAMEN = 2027;
export const CALENDRIER_OFFICIEL = true;

export type ExamSession = { date: string; label: string; time: string; points?: number };
type RawSession = { month: number; day: number; label: string; time: string; points?: number };

const RAW_CALENDAR: Record<string, RawSession[]> = {
  "9e": [
    { month: 6, day: 29, label: "Communication Créole", time: "9h30 – 12h00", points: 300 },
    { month: 6, day: 29, label: "Éducation Physique et Sportive (EPS)", time: "13h00 – 14h30", points: 200 },
    { month: 6, day: 30, label: "Sciences Expérimentales", time: "8h30 – 11h00", points: 300 },
    { month: 6, day: 30, label: "ETAP", time: "11h30 – 13h00", points: 200 },
    { month: 6, day: 30, label: "Communication Française", time: "14h00 – 16h30", points: 300 },
    { month: 7, day: 1, label: "Sciences Sociales (Histoire et Géo)", time: "8h30 – 11h00", points: 300 },
    { month: 7, day: 1, label: "Éducation à la Citoyenneté", time: "11h30 – 13h00", points: 200 },
    { month: 7, day: 1, label: "Anglais", time: "14h00 – 16h00", points: 200 },
    { month: 7, day: 2, label: "Mathématiques", time: "8h30 – 11h30", points: 300 },
    { month: 7, day: 2, label: "EEA", time: "12h00 – 13h30", points: 200 },
    { month: 7, day: 2, label: "Espagnol", time: "14h30 – 16h30", points: 200 },
  ],

  "ns4-svt": [
    { month: 7, day: 13, label: "Philosophie", time: "8h30 – 11h30" },
    { month: 7, day: 13, label: "Chimie", time: "13h00 – 16h00" },
    { month: 7, day: 14, label: "SVT", time: "13h00 – 16h00" },
    { month: 7, day: 15, label: "Physique", time: "8h30 – 11h30" },
    { month: 7, day: 15, label: "Anglais ou Espagnol", time: "14h30 – 16h30" },
    { month: 7, day: 16, label: "Mathématiques", time: "8h30 – 11h00" },
    { month: 7, day: 16, label: "Créole", time: "13h00 – 15h00" },
  ],
  "ns4-lla": [
    { month: 7, day: 13, label: "Philosophie", time: "8h30 – 11h30" },
    { month: 7, day: 13, label: "Chimie", time: "13h00 – 15h00" },
    { month: 7, day: 14, label: "Histoire et Géo", time: "8h30 – 11h30" },
    { month: 7, day: 14, label: "Créole", time: "13h00 – 16h00" },
    { month: 7, day: 15, label: "Arts et Musique", time: "8h30 – 11h30" },
    { month: 7, day: 15, label: "Anglais", time: "13h30 – 16h30" },
    { month: 7, day: 16, label: "Mathématiques", time: "8h30 – 11h00" },
    { month: 7, day: 16, label: "Espagnol", time: "13h30 – 16h30" },
  ],
  "ns4-smp": [
    { month: 7, day: 13, label: "Philosophie", time: "8h30 – 11h30" },
    { month: 7, day: 13, label: "Chimie", time: "13h00 – 15h30" },
    { month: 7, day: 14, label: "Histoire et Géo", time: "8h30 – 11h30" },
    { month: 7, day: 14, label: "SVT", time: "13h00 – 15h00" },
    { month: 7, day: 15, label: "Physique", time: "8h30 – 11h30" },
    { month: 7, day: 15, label: "Anglais ou Espagnol", time: "14h30 – 16h30" },
    { month: 7, day: 16, label: "Mathématiques", time: "8h30 – 12h00" },
    { month: 7, day: 16, label: "Créole", time: "13h00 – 15h00" },
  ],
  "ns4-ses": [
    { month: 7, day: 13, label: "Philosophie", time: "8h30 – 11h30" },
    { month: 7, day: 13, label: "Chimie", time: "13h00 – 15h00" },
    { month: 7, day: 14, label: "Histoire et Géo", time: "8h30 – 11h30" },
    { month: 7, day: 14, label: "SVT", time: "13h00 – 15h00" },
    { month: 7, day: 15, label: "Physique", time: "8h30 – 10h30" },
    { month: 7, day: 15, label: "Économie", time: "11h00 – 14h00" },
    { month: 7, day: 15, label: "Anglais ou Espagnol", time: "14h30 – 16h30" },
    { month: 7, day: 16, label: "Mathématiques", time: "8h30 – 11h00" },
    { month: 7, day: 16, label: "Créole", time: "13h00 – 15h00" },
  ],
};

const pad = (n: number) => String(n).padStart(2, "0");
const WEEKS_52 = 364 * 86400000;

function sessionDate(month: number, day: number): string {
  const base = Date.UTC(BASE_ANNEE, month - 1, day);
  const d = new Date(base + (ANNEE_EXAMEN - BASE_ANNEE) * WEEKS_52);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

function buildCalendar(): Record<string, ExamSession[]> {
  const out: Record<string, ExamSession[]> = {};
  for (const [level, sessions] of Object.entries(RAW_CALENDAR)) {
    out[level] = sessions.map((s) => ({
      date: sessionDate(s.month, s.day),
      label: s.label,
      time: s.time,
      points: s.points,
    }));
  }
  return out;
}

export const EXAM_CALENDAR: Record<string, ExamSession[]> = buildCalendar();

export function nextExamSession(level: string): ExamSession | null {
  const sessions = EXAM_CALENDAR[level] ?? [];
  const now = Date.now();
  const upcoming = sessions
    .map((s) => ({ ...s, ts: new Date(s.date + "T00:00:00").getTime() }))
    .filter((s) => s.ts >= now)
    .sort((a, b) => a.ts - b.ts);
  return upcoming[0] ?? null;
}

export function daysUntilExam(level: string): number | null {
  const next = nextExamSession(level);
  if (!next) return null;
  const diff = Math.ceil((new Date(next.date + "T00:00:00").getTime() - Date.now()) / 86400000);
  return diff >= 0 ? diff : null;
}

export function firstExamDate(level: string): string | null {
  const sessions = EXAM_CALENDAR[level] ?? [];
  if (!sessions.length) return null;
  return sessions.map((s) => s.date).sort()[0];
}
