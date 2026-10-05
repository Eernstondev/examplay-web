"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { subjectName } from "@/lib/content";
import {
  duelError,
  getShowOnline,
  onDuelUpdate,
  onPresence,
  setShowOnline,
  stopPresence,
  syncPresence,
  type DuelRow,
  type Me,
  type OnlinePlayer,
} from "@/lib/realtime";
import type { DuelSummary } from "@/lib/stats";
import { createClient } from "@/lib/supabase/client";

type Tab = "online" | "search" | "duels";
type Found = { id: string; name: string };
type Active = { id: string; opp: string; subject: string };
type Props = {
  me: Me;
  subjects: { value: string; label: string }[];
  points: Record<string, { rank: number; points: number }>;
  history: DuelSummary[];
};

const tabs: { id: Tab; label: string }[] = [
  { id: "online", label: "En ligne" },
  { id: "search", label: "Rechercher" },
  { id: "duels", label: "Duels" },
];

export function Community({ me, subjects, points, history }: Props) {
  const [tab, setTab] = useState<Tab>("online");
  const [players, setPlayers] = useState<OnlinePlayer[]>([]);
  const [visible, setVisible] = useState(true);
  const [subject, setSubject] = useState(subjects[0]?.value ?? "");
  const [status, setStatus] = useState<Record<string, "sent" | "declined">>({});
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [found, setFound] = useState<Found[]>([]);
  const [active, setActive] = useState<Active[]>([]);

  useEffect(() => onPresence(setPlayers), []);

  useEffect(() => {
    const stored = getShowOnline();
    const timer = setTimeout(() => setVisible(stored), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(
    () =>
      onDuelUpdate((row: DuelRow) => {
        if (row.status === "declined") setStatus((s) => ({ ...s, [row.opponent]: "declined" }));
      }),
    [],
  );

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length < 2) return setFound([]);
      const { data } = await createClient().rpc("search_players", { p_query: query });
      setFound(((data as Found[] | null) ?? []).filter((p) => p.id !== me.id));
    }, 300);
    return () => clearTimeout(timer);
  }, [query, me.id]);

  // Duels acceptés que je n'ai pas encore terminés (moins d'une heure), pour les reprendre.
  const loadActive = useCallback(async () => {
    const since = new Date(Date.now() - 3600000).toISOString();
    const { data } = await createClient()
      .from("duels")
      .select(
        "id,subject_id,challenger,opponent,challenger_done,opponent_done,c:profiles!duels_challenger_fkey(name),o:profiles!duels_opponent_fkey(name)",
      )
      .eq("status", "accepted")
      .gte("created_at", since);
    type Join = { name: string } | { name: string }[] | null;
    const nameOf = (x: Join) => (Array.isArray(x) ? x[0] : x)?.name ?? "?";
    setActive(
      (data ?? [])
        .filter((d) => (d.challenger === me.id ? !d.challenger_done : !d.opponent_done))
        .map((d) => ({
          id: d.id,
          opp: nameOf((d.challenger === me.id ? d.o : d.c) as Join),
          subject: subjectName(d.subject_id),
        })),
    );
  }, [me.id]);

  useEffect(() => {
    const timer = setTimeout(loadActive, 0);
    return () => clearTimeout(timer);
  }, [loadActive]);

  const sorted = useMemo(
    () => [...players].sort((a, b) => (points[b.id]?.points ?? 0) - (points[a.id]?.points ?? 0)),
    [players, points],
  );

  const challenge = async (id: string) => {
    setError("");
    if (!subject) return setError("Choisis d'abord la matière du duel.");
    const { error: rpcError } = await createClient().rpc("create_duel", { p_opponent: id, p_subject: subject });
    if (rpcError) return setError(duelError(rpcError.message));
    setStatus((s) => ({ ...s, [id]: "sent" }));
    setTimeout(() => {
      setStatus((s) => {
        if (s[id] !== "sent") return s;
        const next = { ...s };
        delete next[id];
        return next;
      });
    }, 120000);
  };

  const toggleVisible = (value: boolean) => {
    setVisible(value);
    setShowOnline(value);
    if (value) syncPresence(me);
    else stopPresence();
  };

  const playerRow = (p: { id: string; name: string }) => (
    <li key={p.id} className="flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-ink/10">
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-soft font-display font-bold text-brand">
        {p.name.charAt(0).toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{p.name}</p>
        {points[p.id] && (
          <p className="text-sm text-ink/60">
            {points[p.id].rank}ᵉ · {points[p.id].points} pts
          </p>
        )}
      </div>
      <button
        type="button"
        disabled={status[p.id] === "sent"}
        onClick={() => challenge(p.id)}
        className="h-11 shrink-0 rounded-xl bg-brand px-4 text-sm font-bold text-white disabled:bg-ink/15 disabled:text-ink/60"
      >
        {status[p.id] === "sent" ? "Envoyé" : status[p.id] === "declined" ? "Refusé, relancer" : "Défier"}
      </button>
    </li>
  );

  return (
    <div className="mx-auto max-w-2xl">
      <div role="tablist" aria-label="Communauté" className="grid grid-cols-3 gap-1 rounded-2xl bg-white p-1 ring-1 ring-ink/10">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`h-11 rounded-xl text-sm font-bold ${tab === t.id ? "bg-brand text-white" : "text-ink/70"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab !== "duels" && (
        <label className="mt-5 block text-sm font-semibold">
          Matière du duel
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="mt-1.5 h-13 w-full rounded-xl border border-ink/20 bg-white px-4 text-base font-normal"
          >
            {subjects.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      )}

      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-danger-soft px-4 py-3 text-sm font-semibold text-danger">
          {error}
        </p>
      )}

      {tab === "online" && (
        <div className="mt-5">
          <label className="flex items-center justify-between gap-4 rounded-2xl bg-white p-4 ring-1 ring-ink/10">
            <span>
              <span className="block font-semibold">Apparaître en ligne</span>
              <span className="block text-sm text-ink/60">Les élèves de ton département peuvent te défier.</span>
            </span>
            <input
              type="checkbox"
              checked={visible}
              onChange={(e) => toggleVisible(e.target.checked)}
              className="size-6 shrink-0 accent-brand"
            />
          </label>
          {sorted.length ? (
            <ul className="mt-4 grid gap-2.5">{sorted.map(playerRow)}</ul>
          ) : (
            <p className="mt-8 text-center text-ink/70">
              Personne d&apos;autre n&apos;est en ligne dans ton département pour le moment.
            </p>
          )}
        </div>
      )}

      {tab === "search" && (
        <div className="mt-5">
          <label className="block text-sm font-semibold">
            Chercher un élève par son nom
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="mt-1.5 h-13 w-full rounded-xl border border-ink/20 bg-white px-4 text-base font-normal"
            />
          </label>
          {found.length > 0 ? (
            <ul className="mt-4 grid gap-2.5">{found.map(playerRow)}</ul>
          ) : (
            query.trim().length >= 2 && <p className="mt-8 text-center text-ink/70">Aucun élève trouvé.</p>
          )}
        </div>
      )}

      {tab === "duels" && (
        <div className="mt-5">
          {active.length > 0 && (
            <>
              <h2 className="font-display text-lg font-bold">En cours</h2>
              <ul className="mt-3 grid gap-2.5">
                {active.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4 ring-1 ring-ink/10">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">Contre {d.opp}</p>
                      <p className="text-sm text-ink/60">{d.subject}</p>
                    </div>
                    <Link href={`/dashboard/duel?id=${d.id}`} className="grid h-11 shrink-0 place-items-center rounded-xl bg-brand px-4 text-sm font-bold text-white">
                      Reprendre
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
          <h2 className={`font-display text-lg font-bold ${active.length ? "mt-7" : ""}`}>Historique</h2>
          {history.length ? (
            <ul className="mt-3 grid gap-2.5">
              {history.map((d) => {
                const outcome = d.me > d.them ? "Victoire" : d.me < d.them ? "Défaite" : "Nul";
                const tone = d.me > d.them ? "text-success" : d.me < d.them ? "text-danger" : "text-ink/60";
                return (
                  <li key={d.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4 ring-1 ring-ink/10">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">Contre {d.opp}</p>
                      <p className="text-sm text-ink/60">{d.subject}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-display text-lg font-bold tabular-nums">
                        {d.me} – {d.them}
                      </p>
                      <p className={`text-sm font-semibold ${tone}`}>{outcome}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-3 text-ink/70">Tu n&apos;as pas encore joué de duel. Défie un élève en ligne.</p>
          )}
          <p className="mt-6 text-sm text-ink/60">
            Les défis reçus s&apos;affichent en haut de l&apos;écran, où que tu sois dans ton espace.
          </p>
        </div>
      )}
    </div>
  );
}
