import type { AdPlacement } from "@/lib/media";
import { createPublicClient } from "@/lib/supabase/public";

export type Ad = {
  id: string;
  title: string;
  image_url: string;
  link_url: string | null;
  media_type: "image" | "video";
};
type Target = { department: string; level: string };

// Choisit une publicité pour un emplacement. Sans élève connecté (accueil),
// seules les publicités « tous départements, tous niveaux » sont éligibles.
export async function pickAd(placement: AdPlacement, target?: Target): Promise<Ad | null> {
  const { data } = await createPublicClient()
    .from("ads")
    .select("id, title, image_url, link_url, media_type, departments, audience")
    .contains("placements", [placement]);

  const group = target ? (target.level === "9e" ? "9e" : "ns4") : null;
  const eligible = (data ?? []).filter((ad) => {
    const departments = ad.departments as string[];
    if (!target) return departments.length === 0 && ad.audience === "all";
    return (
      (departments.length === 0 || departments.includes(target.department)) &&
      (ad.audience === "all" || ad.audience === group)
    );
  });
  if (!eligible.length) return null;
  const ad = eligible[Math.floor(Math.random() * eligible.length)];
  return {
    id: ad.id,
    title: ad.title,
    image_url: ad.image_url,
    link_url: ad.link_url,
    media_type: ad.media_type === "video" ? "video" : "image",
  };
}
