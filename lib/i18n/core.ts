import HT from "./ht.json";

// Langues de l'interface. La phrase française sert de clé : une phrase absente du
// dictionnaire reste en français. Les questions et leçons ne sont pas traduites.
export type Lang = "fr" | "ht";
export type T = (s: string, vars?: Record<string, string | number>) => string;

export const LANG_COOKIE = "lang";
export const parseLang = (v: string | undefined | null): Lang => (v === "ht" ? "ht" : "fr");

const DICT: Record<string, string> = HT;

// translate("ht", "Tu as {n} points", { n: 3 }) -> « Ou gen 3 pwen ».
// Les espaces autour du texte sont conservés (morceaux de phrases autour d'une variable).
export function translate(lang: Lang, s: string, vars?: Record<string, string | number>) {
  let out = s;
  if (lang === "ht") {
    const k = s.trim();
    const hit = DICT[s] ?? (k && DICT[k] !== undefined ? s.replace(k, () => DICT[k]) : undefined);
    if (hit !== undefined) out = hit;
  }
  if (vars) for (const v in vars) out = out.split(`{${v}}`).join(String(vars[v]));
  return out;
}

export const makeT = (lang: Lang): T => (s, vars) => translate(lang, s, vars);

const HT_DAYS = ["dimanch", "lendi", "madi", "mèkredi", "jedi", "vandredi", "samdi"];
const HT_MONTHS = ["janvye", "fevriye", "mas", "avril", "me", "jen", "jiyè", "out", "septanm", "oktòb", "novanm", "desanm"];
const WEEKDAY_INDEX: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

// « mardi 14 oct. » / « madi 14 oktòb ». Le kreyòl n'est pas fourni par Intl : noms faits main.
export function formatDate(lang: Lang, date: Date, o: { weekday?: boolean; timeZone?: string } = {}) {
  if (lang === "fr") {
    return new Intl.DateTimeFormat("fr-FR", {
      timeZone: o.timeZone,
      weekday: o.weekday ? "long" : undefined,
      day: "numeric",
      month: "short",
    }).format(date);
  }
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: o.timeZone, weekday: "short", day: "numeric", month: "numeric" }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const text = `${get("day")} ${HT_MONTHS[Number(get("month")) - 1]}`;
  return o.weekday ? `${HT_DAYS[WEEKDAY_INDEX[get("weekday")]]} ${text}` : text;
}
