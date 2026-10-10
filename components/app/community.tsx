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

type Tab = "online" | "search" | "friends" | "duels";
type Friend = { id: string; name: string };
type FriendRequest = { id: string; from_id: string; name: string };
type FriendRank = { user_id: string; name: string; points: number; is_me: boolean };
type Found = { id: string; name: string };
type Active = { id: string; opp: string; subject: string };
type Props = {
  me: Me;
  subjects: { value: string; label: string }[];
  points: Record<string, { rank: number; points: number }>;
  history: DuelSummary[];
  initialTab?: Tab;
};

const tabs: { id: Tab; label: string }[] = [
  { id: "online", label: "En ligne" },
  { id: "search", label: "Rechercher" },
  { id: "friends", label: "Amis" },
  { id: "duels", label: "Duels" },
];

const levelGroup = (level: string) => (level === "9e" ? "9e" : "ns4");

function Avatar({ name, online }: { name: string; online: boolean }) {
  return (
    <span className="relative grid size-11 shrink-0 place-items-center rounded-full bg-brand-soft font-display font-bold text-brand-fg">
      {name.charAt(0).toUpperCase()}
      {online && (
        <span
          role="img"
          aria-label="En ligne"
          className="absolute bottom-0 right-0 size-3 rounded-full bg-success ring-2 ring-surface"
        />
      )}
    </span>
  );
}

export function Community({ me, subjects, points, history, initialTab }: Props) {
  const [tab, setTab] = useState<Tab>(initialTab ?? "online");
  const [players, setPlayers] = useState<OnlinePlayer[]>([]);
  const [visible, setVisible] = useState(true);
  const [subject, setSubject] = useState(subjects[0]?.value ?? "");
  const [status, setStatus] = useState<Record<string, "sent" | "declined">>({});
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [found, setFound] = useState<Found[]>([]);
  const [active, setActive] = useState<Active[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [ranking, setRanking] = useState<FriendRank[]>([]);
  const [pendingSent, setPendingSent] = useState<Set<string>>(new Set());

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

  const loadFriends = useCallback(async () => {
    const supabase = createClient();
    const [f, r, l, s] = await Promise.all([
      supabase.rpc("list_friends"),
      supabase.rpc("list_friend_requests"),
      supabase.rpc("friends_leaderboard"),
      supabase.from("friendships").select("addressee").eq("requester", me.id).eq("status", "pending"),
    ]);
    setFriends((f.data as Friend[] | null) ?? []);
    setRequests((r.data as FriendRequest[] | null) ?? []);
    setPendingSent(new Set(((s.data as { addressee: string }[] | null) ?? []).map((x) => x.addressee)));
    setRanking(
      ((l.data as FriendRank[] | null) ?? [])
        .map((x) => ({ ...x, points: Number(x.points) }))
        .sort((a, b) => b.points - a.points),
    );
  }, [me.id]);

  useEffect(() => {
    const timer = setTimeout(loadFriends, 0);
    return () => clearTimeout(timer);
  }, [loadFriends]);

  // Une demande reçue ou acceptée met la liste à jour tout de suite, sans recharger la page.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("friends-" + me.id)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${me.id}` },
        (payload) => {
          const kind = (payload.new as { kind?: string }).kind;
          if (kind === "friend_request" || kind === "friend_accepted") loadFriends();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [me.id, loadFriends]);

  const addFriend = async (id: string) => {
    setError("");
    const { error: rpcError } = await createClient().rpc("send_friend_request", { p_addressee: id });
    if (rpcError) return setError("La demande d'ami n'a pas pu être envoyée (déjà amis ou demande en cours).");
    setPendingSent((s) => new Set(s).add(id));
  };

  const answerRequest = async (id: string, accept: boolean) => {
    await createClient().rpc("respond_friend_request", { p_id: id, p_accept: accept });
    loadFriends();
  };

  const removeFriend = async (id: string, name: string) => {
    if (!window.confirm(`Retirer ${name} de tes amis ?`)) return;
    await createClient().rpc("remove_friend", { p_other: id });
    loadFriends();
  };

  const friendIds = useMemo(() => new Set(friends.map((f) => f.id)), [friends]);

  // Demande reçue : id de la demande, par expéditeur (pour pouvoir l'accepter depuis une ligne de joueur).
  const requestFrom = useMemo(() => new Map(requests.map((r) => [r.from_id, r.id])), [requests]);
  const onlineIds = useMemo(() => new Set(players.map((p) => p.id)), [players]);

  // Amis en ligne (peu importe leur département) puis élèves en ligne de mon département et mon niveau.
  const { onlineFriends, onlineOthers } = useMemo(() => {
    const byPoints = (a: OnlinePlayer, b: OnlinePlayer) => (points[b.id]?.points ?? 0) - (points[a.id]?.points ?? 0);
    const sameGroup = (p: OnlinePlayer) =>
      p.department === me.department && levelGroup(p.level) === levelGroup(me.level);
    return {
      onlineFriends: players.filter((p) => friendIds.has(p.id)).sort(byPoints),
      onlineOthers: players.filter((p) => !friendIds.has(p.id) && sameGroup(p)).sort(byPoints),
    };
  }, [players, friendIds, points, me.department, me.level]);

  const sortedFriends = useMemo(
    () => [...friends].sort((a, b) => Number(onlineIds.has(b.id)) - Number(onlineIds.has(a.id))),
    [friends, onlineIds],
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

  // Un seul bouton par ligne : on ne défie que ses amis ; sinon on envoie (ou on accepte) une demande d'ami.
  const action = (id: string) => {
    const secondary = "h-11 shrink-0 rounded-xl px-3 text-sm font-bold text-brand-fg ring-1 ring-ink/15 disabled:text-ink/50";
    if (friendIds.has(id)) {
      return (
        <button
          type="button"
          disabled={status[id] === "sent"}
          onClick={() => challenge(id)}
          className="h-11 shrink-0 rounded-xl bg-brand px-4 text-sm font-bold text-white disabled:bg-ink/15 disabled:text-ink/60"
        >
          {status[id] === "sent" ? "Envoyé" : status[id] === "declined" ? "Refusé, relancer" : "Défier"}
        </button>
      );
    }
    const received = requestFrom.get(id);
    if (received) {
      return (
        <button
          type="button"
          onClick={() => answerRequest(received, true)}
          className="h-11 shrink-0 rounded-xl bg-brand px-4 text-sm font-bold text-white"
        >
          Accepter
        </button>
      );
    }
    return (
      <button type="button" disabled={pendingSent.has(id)} onClick={() => addFriend(id)} className={secondary}>
        {pendingSent.has(id) ? "Demande envoyée" : "Ajouter"}
      </button>
    );
  };

  const playerRow = (p: { id: string; name: string }) => (
    <li key={p.id} className="flex items-center gap-3 rounded-2xl bg-surface p-3 ring-1 ring-ink/10">
      <Avatar name={p.name} online={onlineIds.has(p.id)} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{p.name}</p>
        {points[p.id] && (
          <p className="text-sm text-ink/60">
            {points[p.id].rank}ᵉ · {points[p.id].points} pts
          </p>
        )}
      </div>
      {action(p.id)}
    </li>
  );

  return (
    <div className="mx-auto max-w-2xl">
      <div role="tablist" aria-label="Communauté" className="grid grid-cols-4 gap-1 rounded-2xl bg-surface p-1 ring-1 ring-ink/10">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`relative h-11 rounded-xl text-[0.8125rem] font-bold sm:text-sm ${tab === t.id ? "bg-brand text-white" : "text-ink/70"}`}
          >
            {t.label}
            {t.id === "friends" && requests.length > 0 && (
              <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-danger" />
            )}
          </button>
        ))}
      </div>

      {tab !== "duels" && (
        <label className="mt-5 block text-sm font-semibold">
          Matière du duel
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="mt-1.5 h-13 w-full rounded-xl border border-ink/20 bg-surface px-4 text-base font-normal"
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
        <p role="alert" className="mt-4 rounded-xl bg-danger-soft px-4 py-3 text-sm font-semibold text-danger-fg">
          {error}
        </p>
      )}

      {tab === "online" && (
        <div className="mt-5">
          <label className="flex items-center justify-between gap-4 rounded-2xl bg-surface p-4 ring-1 ring-ink/10">
            <span>
              <span className="block font-semibold">Apparaître en ligne</span>
              <span className="block text-sm text-ink/60">
                Tes amis te voient en ligne et peuvent te défier.
              </span>
            </span>
            <input
              type="checkbox"
              checked={visible}
              onChange={(e) => toggleVisible(e.target.checked)}
              className="size-6 shrink-0 accent-brand"
            />
          </label>
          {!visible && (
            <p className="mt-4 rounded-xl bg-brand-soft px-4 py-3 text-sm">
              Tu es invisible : active « Apparaître en ligne » pour voir tes amis en ligne et être vu.
            </p>
          )}
          <p className="mt-4 text-sm text-ink/60">
            Tu peux défier uniquement tes amis. Pour défier un élève, envoie-lui d&apos;abord une demande d&apos;ami.
          </p>

          <h2 className="mt-6 font-display text-lg font-bold">Amis en ligne ({onlineFriends.length})</h2>
          {onlineFriends.length ? (
            <ul className="mt-3 grid gap-2.5">{onlineFriends.map(playerRow)}</ul>
          ) : (
            <p className="mt-3 text-ink/70">
              {friends.length
                ? "Aucun de tes amis n'est en ligne pour le moment."
                : "Tu n'as pas encore d'amis. Ajoute un élève ci-dessous."}
            </p>
          )}

          <h2 className="mt-7 font-display text-lg font-bold">
            Autres élèves de ton département ({onlineOthers.length})
          </h2>
          {onlineOthers.length ? (
            <ul className="mt-3 grid gap-2.5">{onlineOthers.map(playerRow)}</ul>
          ) : (
            <p className="mt-3 text-ink/70">Personne d&apos;autre n&apos;est en ligne dans ton département.</p>
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
              className="mt-1.5 h-13 w-full rounded-xl border border-ink/20 bg-surface px-4 text-base font-normal"
            />
          </label>
          {found.length > 0 ? (
            <ul className="mt-4 grid gap-2.5">{found.map(playerRow)}</ul>
          ) : (
            query.trim().length >= 2 && <p className="mt-8 text-center text-ink/70">Aucun élève trouvé.</p>
          )}
        </div>
      )}

      {tab === "friends" && (
        <div className="mt-5">
          {requests.length > 0 && (
            <>
              <h2 className="font-display text-lg font-bold">Demandes reçues</h2>
              <ul className="mb-7 mt-3 grid gap-2.5">
                {requests.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-surface p-3 ring-1 ring-ink/10">
                    <p className="min-w-0 flex-1 basis-32 truncate font-semibold">{r.name}</p>
                    <button type="button" onClick={() => answerRequest(r.id, false)} className="h-11 rounded-xl px-4 text-sm font-bold ring-1 ring-ink/15">
                      Refuser
                    </button>
                    <button type="button" onClick={() => answerRequest(r.id, true)} className="h-11 rounded-xl bg-brand px-4 text-sm font-bold text-white">
                      Accepter
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}

          <h2 className="font-display text-lg font-bold">Mes amis ({friends.length})</h2>
          {friends.length ? (
            <ul className="mt-3 grid gap-2.5">
              {sortedFriends.map((f) => (
                <li key={f.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-surface p-3 ring-1 ring-ink/10">
                  <Avatar name={f.name} online={onlineIds.has(f.id)} />
                  <div className="min-w-0 flex-1 basis-24">
                    <p className="truncate font-semibold">{f.name}</p>
                    {onlineIds.has(f.id) && <p className="text-sm font-semibold text-success-fg">En ligne</p>}
                  </div>
                  <button type="button" onClick={() => removeFriend(f.id, f.name)} className="h-11 rounded-xl px-3 text-sm font-bold text-danger-fg ring-1 ring-ink/15">
                    Retirer
                  </button>
                  <button
                    type="button"
                    disabled={status[f.id] === "sent"}
                    onClick={() => challenge(f.id)}
                    className="h-11 rounded-xl bg-brand px-4 text-sm font-bold text-white disabled:bg-ink/15 disabled:text-ink/60"
                  >
                    {status[f.id] === "sent" ? "Envoyé" : "Défier"}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-ink/70">
              Tu n&apos;as pas encore d&apos;amis. Ajoute un élève depuis « En ligne » ou « Rechercher ».
            </p>
          )}

          {ranking.length > 1 && (
            <>
              <h2 className="mt-7 font-display text-lg font-bold">Classement entre amis</h2>
              <ol className="mt-3 grid gap-2">
                {ranking.map((r, i) => (
                  <li
                    key={r.user_id}
                    className={`flex items-center gap-3 rounded-2xl bg-surface p-3 ${r.is_me ? "ring-2 ring-brand" : "ring-1 ring-ink/10"}`}
                  >
                    <span className="w-8 shrink-0 text-center font-display text-lg font-bold">{i + 1}</span>
                    <p className="min-w-0 flex-1 truncate font-semibold">
                      {r.name}
                      {r.is_me && <span className="ml-2 text-sm font-bold text-brand-fg">Toi</span>}
                    </p>
                    <span className="shrink-0 font-semibold tabular-nums">{r.points} pts</span>
                  </li>
                ))}
              </ol>
            </>
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
                  <li key={d.id} className="flex items-center justify-between gap-3 rounded-2xl bg-surface p-4 ring-1 ring-ink/10">
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
                const tone = d.me > d.them ? "text-success-fg" : d.me < d.them ? "text-danger-fg" : "text-ink/60";
                return (
                  <li key={d.id} className="flex items-center justify-between gap-3 rounded-2xl bg-surface p-4 ring-1 ring-ink/10">
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
