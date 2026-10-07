export const MEDIA_BUCKET = "media";
export const MEDIA_PREFIX = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${MEDIA_BUCKET}/`;

export const PARTNER_CATEGORIES = [
  { id: "sponsor", label: "Sponsors officiels" },
  { id: "expert", label: "Experts et contributeurs" },
  { id: "institution", label: "Écoles et institutions partenaires" },
] as const;

export const AD_PLACEMENTS = [
  { id: "home", label: "Page d'accueil (visiteurs)" },
  { id: "dashboard", label: "Tableau de bord élève" },
  { id: "matieres", label: "Choix de la matière" },
] as const;

export const AD_AUDIENCES = [
  { id: "all", label: "Tous les élèves" },
  { id: "9e", label: "9e AF uniquement" },
  { id: "ns4", label: "NS4 uniquement" },
] as const;

export type AdPlacement = (typeof AD_PLACEMENTS)[number]["id"];

// Seuls les liens http(s) sont acceptés (bloque javascript:, data:, etc.).
export function safeUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}
