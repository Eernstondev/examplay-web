// Niveaux et matières : copie exacte de l'app mobile (src/data/content.ts).
export type LevelId = "9e" | "ns4-ses" | "ns4-svt" | "ns4-lla" | "ns4-smp";
export type Subject = { id: string; name: string; heavy: boolean };

export const LEVELS: { id: LevelId; label: string; description: string }[] = [
  { id: "9e", label: "9e", description: "9e année fondamentale" },
  { id: "ns4-ses", label: "NS4-SES", description: "Sciences économiques et sociales" },
  { id: "ns4-svt", label: "NS4-SVT", description: "Sciences de la vie et de la terre" },
  { id: "ns4-lla", label: "NS4-LLA", description: "Langues, lettres et arts" },
  { id: "ns4-smp", label: "NS4-SMP", description: "Sciences mathématiques et physiques" },
];

const NAMES: Record<string, string> = {
  philo: "Philosophie",
  maths: "Mathématiques",
  biologie: "Biologie",
  geologie: "Géologie",
  anglais: "Anglais",
  histoire: "Histoire",
  geographie: "Géographie",
  chimie: "Chimie",
  espagnol: "Espagnol",
  physique: "Physique",
  economie: "Économie",
  arts: "Arts et musique",
  creole: "Créole",
  francais: "Français",
  sociales: "Sc Sociales",
  sciences: "Sc Expérimentales",
  etap: "ETAP",
  eps: "EPS",
  eea: "EEA",
  citoyennete: "Éducation à la citoyenneté",
  maths9e: "Mathématiques",
  francais9e: "Français",
  anglais9e: "Anglais",
  espagnol9e: "Espagnol",
  creole9e: "Créole",
  sciences_sociales9e: "Sc Sociales",
  sciences_exp9e: "Sc Expérimentales",
  sciences_phys9e: "Sc Physiques",
  esthetique9e: "Éducation esthétique",
  technologie9e: "Éducation à la technologie",
  citoyennete9e: "Éducation à la citoyenneté",
  eps9e: "EPS",
  etap9e: "ETAP",
  mixte: "Toutes les matières",
};

const SCIENCES = [
  "philo", "maths", "biologie", "geologie", "anglais", "histoire",
  "geographie", "chimie", "espagnol", "physique", "creole",
];

// heavy = matières à coefficient ×2
const SERIES: Record<LevelId, { ids: string[]; heavy: string[] }> = {
  "9e": {
    ids: [
      "creole9e", "francais9e", "sciences_sociales9e", "sciences_exp9e", "sciences_phys9e",
      "maths9e", "anglais9e", "espagnol9e", "etap9e", "eps9e", "esthetique9e",
      "technologie9e", "citoyennete9e",
    ],
    heavy: [],
  },
  "ns4-smp": { ids: SCIENCES, heavy: ["maths", "physique"] },
  "ns4-svt": { ids: SCIENCES, heavy: ["biologie", "geologie", "chimie"] },
  "ns4-ses": { ids: [...SCIENCES, "economie"], heavy: ["economie", "histoire", "geographie"] },
  "ns4-lla": {
    ids: ["philo", "histoire", "geographie", "arts", "chimie", "creole", "anglais", "espagnol"],
    heavy: ["philo", "arts", "creole", "anglais", "espagnol"],
  },
};

export function resolveLevel(id?: string | null): LevelId {
  if (id && LEVELS.some((l) => l.id === id)) return id as LevelId;
  if (id === "ns4") return "ns4-svt"; // ancien format
  return "9e";
}

export function getSubjects(level?: string | null): Subject[] {
  const s = SERIES[resolveLevel(level)];
  return s.ids.map((id) => ({ id, name: NAMES[id] ?? id, heavy: s.heavy.includes(id) }));
}

export const subjectName = (id: string) => NAMES[id] ?? id;
export const coef = (s: Subject) => (s.heavy ? 2 : 1);
export const levelLabel = (id?: string | null) =>
  LEVELS.find((l) => l.id === resolveLevel(id))?.label ?? "9e";

export const DEPARTMENTS = [
  "Artibonite", "Grand'Anse", "Centre", "Nippes", "Nord",
  "Nord-Est", "Nord-Ouest", "Ouest", "Sud", "Sud-Est",
];
