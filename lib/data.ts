import { cache } from "react";
import { annaleKey, type Annale } from "@/lib/annales";
import { getSubjects, resolveLevel, subjectName, type LevelId } from "@/lib/content";
import type { DuelSummary, Result } from "@/lib/stats";
import { createClient } from "@/lib/supabase/server";

export type Account = {
  id: string;
  email: string;
  name: string;
  level: LevelId;
  department: string;
  referralCode: string | null;
};

type Context = {
  id: string;
  email: string | null;
  name: string | null;
  level: string | null;
  department: string | null;
  referral_code: string | null;
  is_admin: boolean;
  is_contributor: boolean;
};

// Profil et rôles du compte connecté en un seul aller-retour, une fois par requête.
// Le serveur Supabase vérifie le jeton de session à cet appel.
export const getContext = cache(async (): Promise<Context | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("my_context");
  if (!error) return (data as Context | null) ?? null;

  // Fonction my_context absente ou session invalide : ancien chemin, plus lent.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const [profile, admin, contributor] = await Promise.all([
    supabase.from("profiles").select("name,level,department,referral_code").eq("id", user.id).maybeSingle(),
    supabase.rpc("is_admin"),
    supabase.rpc("is_contributor"),
  ]);
  return {
    id: user.id,
    email: user.email ?? null,
    name: profile.data?.name || user.user_metadata?.name || null,
    level: profile.data?.level ?? null,
    department: profile.data?.department ?? null,
    referral_code: profile.data?.referral_code ?? null,
    is_admin: admin.data === true,
    is_contributor: contributor.data === true,
  };
});

export const getAccount = cache(async (): Promise<Account | null> => {
  const context = await getContext();
  if (!context) return null;
  return {
    id: context.id,
    email: context.email ?? "",
    name: context.name || "élève",
    level: resolveLevel(context.level),
    department: context.department ?? "Ouest",
    referralCode: context.referral_code,
  };
});

export const getResults = cache(async (): Promise<Result[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("results")
    .select("id,subject_id,subject_name,mode,correct,total,created_at,duration_sec")
    .order("created_at", { ascending: false })
    .limit(300);
  return (data ?? []).map((r) => ({
    id: r.id,
    subjectId: r.subject_id,
    subjectName: r.subject_name,
    mode: r.mode,
    correct: r.correct,
    total: r.total,
    date: new Date(r.created_at).getTime(),
    durationSec: r.duration_sec ?? undefined,
  }));
});

type DuelJoin = { name: string } | { name: string }[] | null;
const nameOf = (x: DuelJoin) => (Array.isArray(x) ? x[0] : x)?.name ?? "?";

export const getFinishedDuels = cache(async (userId: string): Promise<DuelSummary[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("duels")
    .select(
      "id,subject_id,challenger,opponent,challenger_score,opponent_score,created_at,c:profiles!duels_challenger_fkey(name),o:profiles!duels_opponent_fkey(name)",
    )
    .eq("status", "finished")
    .order("created_at", { ascending: false })
    .limit(50);
  return (data ?? []).map((d) => {
    const mine = d.challenger === userId;
    return {
      id: d.id,
      opp: nameOf((mine ? d.o : d.c) as DuelJoin),
      subject: subjectName(d.subject_id),
      me: mine ? d.challenger_score : d.opponent_score,
      them: mine ? d.opponent_score : d.challenger_score,
      date: new Date(d.created_at).getTime(),
    };
  });
});

export type Streak = { streak: number; shields: number; activeToday: boolean };

export const getStreak = cache(async (): Promise<Streak> => {
  const supabase = await createClient();
  const { data } = await supabase.rpc("user_streak_state");
  return {
    streak: data?.streak ?? 0,
    shields: data?.shields ?? 0,
    activeToday: !!data?.active_today,
  };
});

export type Player = { id: string; name: string; points: number; rank: number; me: boolean };
export type Board = { rows: Player[]; total: number; me: Player | null };

// Classement du département de l'élève (même groupe de niveau : 9e ou NS4).
// Même fonction SQL que la page Classement et l'app : un seul calcul de rang partout.
export const getLeaderboard = cache(async (limit: number): Promise<Board> => {
  const account = await getAccount();
  if (!account) return { rows: [], total: 0, me: null };
  const r = await getRanking(account.department, account.level === "9e" ? "9e" : "ns4", limit);
  const rows: Player[] = r.rows.map(({ id, name, points, rank, me }) => ({ id, name, points, rank, me }));
  return { rows, total: r.total, me: rows.find((x) => x.me) ?? null };
});

export type RankedPlayer = Player & { department: string; level: string };
export type Ranking = { rows: RankedPlayer[]; total: number; me: RankedPlayer | null; error: boolean };

// Classement filtré : department null = tout Haïti ; level null = tous, "9e", "ns4" ou une série.
export const getRanking = cache(
  async (department: string | null, level: string | null, limit: number): Promise<Ranking> => {
    const supabase = await createClient();
    const account = await getAccount();
    const { data, error } = await supabase.rpc("ranking", {
      p_department: department,
      p_level: level,
      p_limit: limit,
    });
    if (error || !data) return { rows: [], total: 0, me: null, error: true };
    const rows: RankedPlayer[] = (
      data as {
        user_id: string;
        name: string;
        department: string;
        level: string;
        points: number;
        pos: number;
      }[]
    ).map((r) => ({
      id: r.user_id,
      name: r.name,
      department: r.department,
      level: r.level,
      points: Number(r.points),
      rank: Number(r.pos),
      me: r.user_id === account?.id,
    }));
    const total = data.length ? Number((data[0] as { total: number }).total) : 0;
    return { rows, total, me: rows.find((r) => r.me) ?? null, error: false };
  },
);

// Défi de la semaine : points gagnés depuis lundi (offset 0) ou la semaine dernière (offset 1).
export const getWeeklyRanking = cache(
  async (department: string | null, level: string | null, limit: number, offset: number): Promise<Ranking> => {
    const supabase = await createClient();
    const account = await getAccount();
    const { data, error } = await supabase.rpc("weekly_ranking", {
      p_department: department,
      p_level: level,
      p_limit: limit,
      p_week_offset: offset,
    });
    if (error || !data) return { rows: [], total: 0, me: null, error: true };
    const rows: RankedPlayer[] = (
      data as { user_id: string; name: string; department: string; level: string; points: number; pos: number }[]
    ).map((r) => ({
      id: r.user_id,
      name: r.name,
      department: r.department,
      level: r.level,
      points: Number(r.points),
      rank: Number(r.pos),
      me: r.user_id === account?.id,
    }));
    const total = data.length ? Number((data[0] as { total: number }).total) : 0;
    return { rows, total, me: rows.find((r) => r.me) ?? null, error: false };
  },
);

export const getQuestionCounts = cache(async (): Promise<Record<string, number>> => {
  const supabase = await createClient();
  const { data } = await supabase.rpc("question_counts");
  const counts: Record<string, number> = {};
  ((data as { subject_id: string; total: number }[]) ?? []).forEach((r) => {
    counts[r.subject_id] = Number(r.total) || 0;
  });
  return counts;
});

// Annales disponibles pour une matière, avec leur nombre de questions jouables en simulation.
export const getAnnales = cache(async (subject: string): Promise<(Annale & { count: number })[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("questions")
    .select("year, session")
    .eq("subject_id", subject)
    .eq("active", true)
    .not("year", "is", null)
    .not("session", "is", null);
  const byKey = new Map<string, Annale & { count: number }>();
  (data ?? []).forEach((r) => {
    const a = { year: r.year as number, session: (r.session as string).trim() };
    if (!a.session) return;
    const key = annaleKey(a);
    byKey.set(key, { ...a, count: (byKey.get(key)?.count ?? 0) + 1 });
  });
  return [...byKey.values()].sort((a, b) => b.year - a.year || a.session.localeCompare(b.session));
});

export const getReferralCount = cache(async (): Promise<number> => {
  const supabase = await createClient();
  const { data } = await supabase.rpc("my_referral_count");
  return Number(data) || 0;
});

export { getSubjects };
