import type { Subject } from "@/lib/content";
import { globalProgress, haitiTime, pct, type DuelSummary, type Result } from "@/lib/stats";

// Badges : mêmes identifiants, titres et règles que l'app mobile (lib/badges.ts).
export type Badge = {
  id: string;
  title: string;
  desc: string;
  emoji: string;
  done: boolean;
  progress: number;
  goal: number;
};

const SUBJECT_EMOJI: Record<string, string> = {
  maths: "➗", francais: "📖", anglais: "🇬🇧", espagnol: "🇪🇸", creole: "🗣️",
  histoire: "🏛️", geographie: "🗺️", physique: "⚡", chimie: "🧪", biologie: "🌱",
  sciences: "🔬", sociales: "🌍", etap: "🛠️", eps: "🏃", eea: "🎨",
  citoyennete: "🤝", philo: "🧠", economie: "💰", arts: "🎭",
};

export function computeBadges(
  results: Result[],
  duels: DuelSummary[],
  subjects: Subject[],
  level: string,
  days: number,
  referralCount = 0,
): Badge[] {
  const times = results.map((r) => ({ r, t: haitiTime(r.date) }));
  const total = results.length;
  const exams = results.filter((r) => r.mode === "exam").length;
  const perfect = results.filter((r) => pct(r) === 100).length;
  const perfectExam = results.filter((r) => r.mode === "exam" && pct(r) === 100).length;
  const wins = duels.filter((d) => d.me > d.them).length;
  const losses = duels.filter((d) => d.me < d.them).length;
  const draws = duels.filter((d) => d.me === d.them).length;
  const subjectsDone = new Set(results.map((r) => r.subjectId)).size;
  const heavyIds = new Set(subjects.filter((s) => s.heavy).map((s) => s.id));
  const heavyPerfect = results.filter((r) => pct(r) === 100 && heavyIds.has(r.subjectId)).length;
  const earlyCount = times.filter(({ t }) => t.hour < 7).length;
  const nightCount = times.filter(({ t }) => t.hour >= 22).length;
  const weekendCount = times.filter(({ t }) => t.weekend).length;
  const fastQuizzes = results.filter(
    (r) => r.mode === "quiz" && typeof r.durationSec === "number" && r.durationSec <= 120,
  ).length;
  const totalCorrect = results.reduce((a, r) => a + r.correct, 0);
  const global = globalProgress(results, subjects);
  const examSubjectsDone = subjects.filter((s) =>
    results.some((r) => r.subjectId === s.id && r.mode === "exam"),
  ).length;

  const bySubject: Record<string, number> = {};
  results.forEach((r) => (bySubject[r.subjectId] = (bySubject[r.subjectId] ?? 0) + 1));
  const oneSubjectMastered = Object.values(bySubject).some((n) => n >= 10);

  const byDay: Record<string, number> = {};
  const subjectsPerDay: Record<string, Set<string>> = {};
  times.forEach(({ r, t }) => {
    byDay[t.day] = (byDay[t.day] ?? 0) + 1;
    (subjectsPerDay[t.day] ??= new Set()).add(r.subjectId);
  });
  const goodDay = Math.max(0, ...Object.values(byDay));
  const maxSubjectsInDay = Math.max(0, ...Object.values(subjectsPerDay).map((s) => s.size));

  const sortedDuels = [...duels].sort((a, b) => a.date - b.date);
  let comebackWin = false;
  let curWinStreak = 0;
  let maxWinStreak = 0;
  sortedDuels.forEach((d, i) => {
    if (d.me > d.them) {
      curWinStreak++;
      maxWinStreak = Math.max(maxWinStreak, curWinStreak);
      if (i > 0 && sortedDuels[i - 1].me < sortedDuels[i - 1].them) comebackWin = true;
    } else {
      curWinStreak = 0;
    }
  });

  const mk = (id: string, title: string, desc: string, emoji: string, progress: number, goal: number): Badge => ({
    id, title, desc, emoji, progress: Math.min(progress, goal), goal, done: progress >= goal,
  });
  const isNs4 = level !== "9e";

  const general: Badge[] = [
    mk("first", "Premier pas", "Termine ton premier quiz", "🎯", total, 1),
    mk("streak3", "3 jours", "Garde ta série 3 jours d'affilée", "🔥", days, 3),
    mk("streak7", "7 jours", "Garde ta série 7 jours d'affilée", "🔥", days, 7),
    mk("streak14", "14 jours", "Garde ta série 14 jours d'affilée", "⚡", days, 14),
    mk("streak30", "30 jours", "Garde ta série 30 jours d'affilée", "👑", days, 30),
    mk("streak100", "100 jours", "Garde ta série 100 jours d'affilée", "🏔️", days, 100),
    mk("streak200", "200 jours", "Garde ta série 200 jours d'affilée", "🌋", days, 200),
    mk("perfect", "Sans faute", "Obtiens 100% à un quiz", "💎", perfect, 1),
    mk("perfect5", "Perfectionniste", "Obtiens 100% à 5 quiz", "🌟", perfect, 5),
    mk("perfect20", "Précision totale", "Obtiens 100% à 20 quiz", "💠", perfect, 20),
    mk("perfect50", "Sans-faute légendaire", "Obtiens 100% à 50 quiz", "🏵️", perfect, 50),
    mk("perfectexam", "Simulation parfaite", "Obtiens 100% à une simulation d'examen", "🥇", perfectExam, 1),
    mk("marathon", "Marathonien", "50 quiz complétés", "🏃", total, 50),
    mk("marathon100", "Centurion", "100 quiz complétés", "🏆", total, 100),
    mk("marathon250", "Légende", "250 quiz complétés", "🦉", total, 250),
    mk("marathon500", "Increvable", "500 quiz complétés", "🦁", total, 500),
    mk("allsubjects", "Toutes les matières", "Fais au moins un quiz dans chaque matière", "📚", subjectsDone, subjects.length),
    mk("mastery", "Spécialiste", "Fais 10 quiz dans une même matière", "🎓", oneSubjectMastered ? 1 : 0, 1),
    isNs4
      ? mk("exam_ready", "Prêt pour le Bac", "Fais une simulation dans chaque matière de ta série", "🎓", examSubjectsDone, subjects.length)
      : mk("exam_ready", "Prêt pour l'examen de 9e", "Fais une simulation dans chaque matière au programme", "🎓", examSubjectsDone, subjects.length),
    isNs4
      ? mk("champion", "Champion NS4", "Atteins 95% de progression globale", "👑", global, 95)
      : mk("champion", "Champion de la 9e", "Atteins 95% de progression globale", "👑", global, 95),
    mk("duel1", "Premier duel gagné", "Remporte ton premier duel", "⚔️", wins, 1),
    mk("duel10", "Duelliste", "Remporte 10 duels", "🥇", wins, 10),
    mk("duel30", "Champion des duels", "Remporte 30 duels", "🛡️", wins, 30),
    mk("duel50", "Invaincu", "Remporte 50 duels", "🏅", wins, 50),
    mk("duelstreak3", "Série de victoires", "Gagne 3 duels d'affilée", "🔥", maxWinStreak, 3),
    mk("duelstreak5", "Domination", "Gagne 5 duels d'affilée", "💥", maxWinStreak, 5),
    mk("firstduel", "Premier duel", "Joue ton premier duel (gagné ou perdu)", "🎮", wins + losses + draws, 1),
    mk("draw", "Match nul", "Termine un duel à égalité", "🤝", draws > 0 ? 1 : 0, 1),
    mk("comeback_duel", "Revanche", "Gagne un duel juste après en avoir perdu un", "🔄", comebackWin ? 1 : 0, 1),
    mk("exam1", "Jour J", "Termine ta première simulation d'examen", "📝", exams, 1),
    mk("exam10", "Endurance d'examen", "10 simulations complétées", "📝", exams, 10),
    mk("heavy", "Matière forte", "Réussis 100% sur une matière à coefficient ×2", "🧠", heavyPerfect, 1),
    mk("earlybird", "Lève-tôt", "Fais un quiz avant 7h du matin", "🌅", earlyCount > 0 ? 1 : 0, 1),
    mk("earlybird5", "Rituel matinal", "Fais 5 quiz avant 7h du matin", "🌄", earlyCount, 5),
    mk("nightowl", "Oiseau de nuit", "Fais un quiz après 22h", "🌙", nightCount > 0 ? 1 : 0, 1),
    mk("nightowl5", "Veilleur", "Fais 5 quiz après 22h", "🌌", nightCount, 5),
    mk("weekend", "Studieux du week-end", "Fais 10 quiz un samedi ou dimanche", "📅", weekendCount, 10),
    mk("bigday", "Journée productive", "Fais 10 quiz dans la même journée", "💪", goodDay, 10),
    mk("balanced", "Éclectique du jour", "Fais des quiz dans 3 matières différentes le même jour", "🎨", maxSubjectsInDay, 3),
    mk("speedster", "Éclair", "Termine un quiz rapide en moins de 2 minutes", "⚡", fastQuizzes > 0 ? 1 : 0, 1),
    mk("speedster5", "Vitesse constante", "5 quiz rapides terminés en moins de 2 minutes", "🚀", fastQuizzes, 5),
    mk("correct100", "Cent bonnes réponses", "Totalise 100 bonnes réponses", "✅", totalCorrect, 100),
    mk("correct500", "Cinq cents bonnes réponses", "Totalise 500 bonnes réponses", "✅", totalCorrect, 500),
    mk("ref1", "Parrain", "Invite ton premier ami avec ton code", "🤝", referralCount, 1),
    mk("ref5", "Ambassadeur", "Invite 5 amis avec ton code", "📣", referralCount, 5),
    mk("ref10", "Recruteur", "Invite 10 amis avec ton code", "🌐", referralCount, 10),
  ];

  const perSubject: Badge[] = subjects.map((s) => {
    const list = results.filter((r) => r.subjectId === s.id);
    const avg = list.length ? Math.round(list.reduce((a, r) => a + pct(r), 0) / list.length) : 0;
    return {
      id: `subject_${s.id}`,
      title: `Maîtrise : ${s.name}`,
      desc: `Score moyen ≥ 70% sur au moins 5 quiz de ${s.name}`,
      emoji: SUBJECT_EMOJI[s.id.replace(/9e$/, "")] ?? "📘",
      done: list.length >= 5 && avg >= 70,
      progress: Math.min(list.length, 5),
      goal: 5,
    };
  });

  return [...general, ...perSubject];
}
