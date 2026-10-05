import { cache } from "react";
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

// Compte connecté, lu une seule fois par requête.
export const getAccount = cache(async (): Promise<Account | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("name,level,department,referral_code")
    .eq("id", user.id)
    .maybeSingle();

  return {
    id: user.id,
    email: user.email ?? "",
    name: data?.name || user.user_metadata?.name || "élève",
    level: resolveLevel(data?.level),
    department: data?.department ?? "Ouest",
    referralCode: data?.referral_code ?? null,
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
export const getLeaderboard = cache(async (limit: number): Promise<Board> => {
  const supabase = await createClient();
  const account = await getAccount();
  const { data } = await supabase.rpc("leaderboard", { p_limit: limit });
  const rows: Player[] = ((data as { user_id: string; name: string; points: number; pos: number }[]) ?? []).map(
    (r) => ({
      id: r.user_id,
      name: r.name,
      points: Number(r.points),
      rank: Number(r.pos),
      me: r.user_id === account?.id,
    }),
  );
  const total = data?.length ? Number((data[0] as { total: number }).total) : 0;
  return { rows, total, me: rows.find((r) => r.me) ?? null };
});

export const getQuestionCounts = cache(async (): Promise<Record<string, number>> => {
  const supabase = await createClient();
  const { data } = await supabase.rpc("question_counts");
  const counts: Record<string, number> = {};
  ((data as { subject_id: string; total: number }[]) ?? []).forEach((r) => {
    counts[r.subject_id] = Number(r.total) || 0;
  });
  return counts;
});

export const getReferralCount = cache(async (): Promise<number> => {
  const supabase = await createClient();
  const { data } = await supabase.rpc("my_referral_count");
  return Number(data) || 0;
});

export { getSubjects };
