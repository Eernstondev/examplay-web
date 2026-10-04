import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export type Account = {
  user: User;
  name: string;
  level?: string;
  department?: string;
  points: number;
  streak: number;
};

const text = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);
const count = (...values: unknown[]) => {
  const found = values.find((v) => typeof v === "number" && Number.isFinite(v));
  return typeof found === "number" ? Math.max(0, Math.floor(found)) : 0;
};

// Lit le compte connecté. Les noms de colonnes de `profiles` ne sont pas encore
// confirmés : on essaie les variantes courantes, puis les métadonnées du compte.
export async function getAccount(): Promise<Account | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  const profile: Record<string, unknown> = data ?? {};
  const meta = user.user_metadata ?? {};

  return {
    user,
    name:
      text(profile.full_name) ??
      text(profile.name) ??
      text(profile.username) ??
      text(meta.full_name) ??
      "élève",
    level: text(profile.level) ?? text(profile.niveau) ?? text(meta.level),
    department: text(profile.department) ?? text(profile.departement) ?? text(meta.department),
    points: count(profile.points, profile.total_points, profile.score, profile.xp),
    streak: count(profile.streak, profile.current_streak, profile.streak_days),
  };
}
