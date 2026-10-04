// `value` est la valeur enregistrée dans le compte (format de la politique de
// confidentialité : « NS4-SVT », « 9e »). À aligner sur l'app mobile si elle diffère.
export const levels = [
  { slug: "9e", value: "9e", label: "9e année fondamentale", short: "9e AF" },
  { slug: "ns4-ses", value: "NS4-SES", label: "NS4, série SES", short: "SES" },
  { slug: "ns4-svt", value: "NS4-SVT", label: "NS4, série SVT", short: "SVT" },
  { slug: "ns4-lla", value: "NS4-LLA", label: "NS4, série LLA", short: "LLA" },
  { slug: "ns4-smp", value: "NS4-SMP", label: "NS4, série SMP", short: "SMP" },
] as const;

export type Level = (typeof levels)[number];

export const ns4Tracks = [
  { slug: "ns4-ses", code: "SES", name: "Sciences économiques et sociales" },
  { slug: "ns4-svt", code: "SVT", name: "Sciences de la vie et de la Terre" },
  { slug: "ns4-lla", code: "LLA", name: "Lettres, langues et arts" },
  { slug: "ns4-smp", code: "SMP", name: "Sciences mathématiques et physiques" },
] as const;

export const departments = [
  "Ouest",
  "Sud",
  "Nord",
  "Nippes",
  "Grand'Anse",
  "Sud-Est",
  "Nord-Ouest",
  "Artibonite",
  "Centre",
  "Nord-Est",
] as const;

export function findLevel(slug: string | undefined): Level | undefined {
  return levels.find((l) => l.slug === slug);
}

export function levelLabel(value: string | undefined): string | undefined {
  return levels.find((l) => l.value === value)?.label ?? value;
}
