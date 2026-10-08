"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { subjectName } from "@/lib/content";
import { emitDuelUpdate, stopPresence, syncPresence, type DuelRow, type Me } from "@/lib/realtime";
import { createClient } from "@/lib/supabase/client";

type Notice = { id: string; duelId?: string; title: string; subtitle: string };

// Présent sur tout l'espace élève : signale sa présence en ligne et reçoit les défis.
export function RealtimeHub({ id, name, department, level }: Me) {
  const router = useRouter();
  const me = useMemo(() => ({ id, name, department, level }), [id, name, department, level]);
  const handled = useRef(new Set<string>());
  const [notices, setNotices] = useState<Notice[]>([]);

  useEffect(() => {
    const supabase = createClient();
    const dismissLater = (id: string, ms: number) =>
      setTimeout(() => setNotices((n) => n.filter((x) => x.id !== id)), ms);

    const nameOf = async (id: string) => {
      const { data } = await supabase.from("profiles").select("name").eq("id", id).maybeSingle();
      return data?.name ?? "Un joueur";
    };

    const incoming = async (row: DuelRow) => {
      if (row.status !== "pending" || handled.current.has(row.id)) return;
      const age = Date.now() - new Date(row.created_at).getTime();
      if (age > 120000) return;
      handled.current.add(row.id);
      const who = await nameOf(row.challenger);
      const id = "invite-" + row.id;
      setNotices((n) => [
        ...n,
        { id, duelId: row.id, title: `${who} te défie`, subtitle: subjectName(row.subject_id) },
      ]);
      dismissLater(id, 120000 - age);
    };

    const updated = async (row: DuelRow) => {
      emitDuelUpdate(row);
      const key = row.id + row.status;
      if (handled.current.has(key)) return;
      handled.current.add(key);
      if (row.status === "accepted") {
        router.push(`/dashboard/duel?id=${row.id}`);
      } else if (row.status === "declined") {
        const who = await nameOf(row.opponent);
        const id = "decl-" + row.id;
        setNotices((n) => [...n, { id, title: "Défi refusé", subtitle: `${who} a refusé ton duel.` }]);
        dismissLater(id, 6000);
      }
    };

    const catchUp = async () => {
      const since = new Date(Date.now() - 120000).toISOString();
      const { data } = await supabase
        .from("duels")
        .select("*")
        .eq("opponent", me.id)
        .eq("status", "pending")
        .gte("created_at", since);
      (data ?? []).forEach((r) => incoming(r as DuelRow));
    };

    const inbox = supabase
      .channel("duel-inbox-" + me.id)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "duels", filter: `opponent=eq.${me.id}` },
        (p) => incoming(p.new as DuelRow),
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "duels", filter: `challenger=eq.${me.id}` },
        (p) => updated(p.new as DuelRow),
      )
      .subscribe();

    catchUp();
    syncPresence(me);
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        syncPresence(me);
        catchUp();
      } else {
        stopPresence();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      stopPresence();
      supabase.removeChannel(inbox);
    };
  }, [me, router]);

  const respond = async (notice: Notice, accept: boolean) => {
    setNotices((n) => n.filter((x) => x.id !== notice.id));
    if (!notice.duelId) return;
    if (accept) router.push(`/dashboard/duel?id=${notice.duelId}`);
    await createClient().rpc("respond_duel", { p_id: notice.duelId, p_accept: accept });
  };

  if (!notices.length) return null;

  return (
    <div
      aria-live="assertive"
      className="fixed inset-x-0 top-0 z-50 mx-auto grid w-full max-w-md gap-2 px-4 pt-[calc(0.75rem+env(safe-area-inset-top))]"
    >
      {notices.map((notice) => (
        <div
          key={notice.id}
          role="alert"
          className="rounded-2xl bg-navy p-4 text-white shadow-[0_20px_40px_-16px_rgba(11,37,89,0.6)]"
        >
          <p className="font-display text-lg font-bold leading-snug">{notice.title}</p>
          <p className="text-sm text-white/75">{notice.subtitle}</p>
          {notice.duelId ? (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => respond(notice, true)}
                className="h-11 rounded-xl bg-sun font-bold text-sun-ink"
              >
                Accepter
              </button>
              <button
                type="button"
                onClick={() => respond(notice, false)}
                className="h-11 rounded-xl bg-white/15 font-bold"
              >
                Refuser
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => respond(notice, false)}
              className="mt-2 min-h-11 text-sm font-semibold underline underline-offset-4"
            >
              Fermer
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
