import { DEPARTMENTS, LEVELS, type LevelId } from "@/lib/content";

// Parcours d'inscription : les identifiants sont ceux de l'app mobile.
export const ns4Tracks = LEVELS.filter((l) => l.id !== "9e").map((l) => ({
  slug: l.id,
  code: l.label.replace("NS4-", ""),
  name: l.description,
}));

export const departments = DEPARTMENTS;

export function findLevel(slug: string | undefined) {
  const level = LEVELS.find((l) => l.id === slug);
  if (!level) return undefined;
  return {
    slug: level.id as LevelId,
    label: level.id === "9e" ? "9e année fondamentale" : `NS4, série ${level.label.slice(4)}`,
  };
}
