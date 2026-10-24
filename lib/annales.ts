// Annales : questions marquées d'une année et d'une session (ex. 2026, « Texte modèle mai 2026 »).
export type Annale = { year: number; session: string };

// Clé d'URL : « 2026:Texte modèle mai 2026 ».
export const annaleKey = (a: Annale) => `${a.year}:${a.session}`;

export function parseAnnale(value: unknown): Annale | null {
  if (typeof value !== "string") return null;
  const i = value.indexOf(":");
  const year = Number(value.slice(0, i));
  const session = value.slice(i + 1).trim();
  if (i < 1 || !Number.isInteger(year) || year < 1900 || year > 2100 || !session) return null;
  return { year, session };
}
