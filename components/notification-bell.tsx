"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { subjectName } from "@/lib/content";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/components/i18n-provider";
import type { T } from "@/lib/i18n/core";

type Notif = {
  id: string;
  kind:
    | "duel_challenge"
    | "duel_finished"
    | "report_resolved"
    | "friend_request"
    | "friend_accepted"
    | "study_reminder"
    | "streak_danger";
  data: Record<string, unknown>;
  read: boolean;
  created_at: string;
};

function describe(n: Notif, t: T): { text: string; href: string } {
  const d = n.data;
  const subject = subjectName(String(d.subject_id));
  const from = (d.from_name as string) || t("Un élève");
  if (n.kind === "duel_challenge") {
    return { text: t("{from} t'a défié en {subject}.", { from, subject }), href: "/dashboard/communaute" };
  }
  if (n.kind === "duel_finished") {
    return {
      text: d.won ? t("Tu as gagné ton duel en {subject} !", { subject }) : t("Tu as perdu ton duel en {subject}.", { subject }),
      href: "/dashboard/communaute",
    };
  }
  if (n.kind === "friend_request") {
    return { text: t("{from} t'a envoyé une demande d'ami.", { from }), href: "/dashboard/communaute?tab=friends" };
  }
  if (n.kind === "friend_accepted") {
    return {
      text: t("{from} a accepté ta demande d'ami. Vous pouvez maintenant vous défier.", { from }),
      href: "/dashboard/communaute?tab=friends",
    };
  }
  if (n.kind === "streak_danger") {
    const days = Number(d.streak) || 0;
    return {
      text: days > 1
        ? t("Ta série de {days} jours est en danger : fais un quiz aujourd'hui.", { days })
        : t("Ta série est en danger : fais un quiz aujourd'hui."),
      href: "/dashboard",
    };
  }
  if (n.kind === "study_reminder") {
    return { text: t("Tu n'as pas révisé aujourd'hui. Un quiz rapide de 5 questions ?"), href: "/dashboard" };
  }
  return {
    text: d.status === "resolved" ? t("Ton signalement a été pris en compte.") : t("Ton signalement a été refusé."),
    href: "/dashboard",
  };
}

const ANSWER_LABEL = { accepted: "Demande acceptée", declined: "Demande refusée", error: "Demande déjà traitée" } as const;
type Answer = keyof typeof ANSWER_LABEL;

export function NotificationBell({ userId }: { userId: string }) {
  const t = useT();
  const [items, setItems] = useState<Notif[]>([]);
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("notifications")
      .select("id, kind, data, read, created_at")
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => setItems((data as Notif[] | null) ?? []));

    const channel = supabase
      .channel("notifications-" + userId)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => setItems((prev) => [payload.new as Notif, ...prev].slice(0, 20)),
      )
      // Une demande d'ami traitée (ici ou sur un autre appareil) perd ses boutons.
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) =>
          setItems((prev) => prev.map((n) => (n.id === (payload.new as Notif).id ? (payload.new as Notif) : n))),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [open]);

  const unread = items.filter((n) => !n.read).length;

  const answer = async (n: Notif, accept: boolean) => {
    setAnswers((a) => ({ ...a, [n.id]: accept ? "accepted" : "declined" }));
    const { error } = await createClient().rpc("respond_friend_request", {
      p_id: String(n.data.request_id),
      p_accept: accept,
    });
    if (error) setAnswers((a) => ({ ...a, [n.id]: "error" }));
  };

  const onOpen = async () => {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      await createClient().from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false);
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={onOpen}
        aria-label={unread ? t("Notifications, {unread} non lues", { unread }) : t("Notifications")}
        className="relative grid size-11 place-items-center rounded-full text-ink/70 hover:bg-surface hover:text-brand-fg"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 grid size-4 place-items-center rounded-full bg-danger text-[10px] font-semibold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-2 w-80 max-w-[90vw] rounded-2xl bg-surface p-2 shadow-xl ring-1 ring-ink/[0.06]">
          {items.length === 0 ? (
            <p className="p-4 text-center text-sm text-ink/60">{t("Aucune notification pour le moment.")}</p>
          ) : (
            <ul className="max-h-96 overflow-y-auto">
              {items.map((n) => {
                const { text, href } = describe(n, t);
                const pendingRequest = n.kind === "friend_request" && !n.data.answered && !answers[n.id];
                const result = answers[n.id] ?? (n.data.answered === "accepted" ? "accepted" : n.data.answered ? "declined" : null);
                return (
                  <li key={n.id}>
                    <Link
                      href={href}
                      onClick={() => setOpen(false)}
                      className={`block rounded-xl px-3 py-2.5 text-sm hover:bg-brand-soft ${n.read ? "text-ink/70" : "font-semibold text-ink"}`}
                    >
                      {text}
                    </Link>
                    {pendingRequest && (
                      <div className="grid grid-cols-2 gap-2 px-3 pb-2.5">
                        <button
                          type="button"
                          onClick={() => answer(n, false)}
                          className="h-10 rounded-xl text-sm font-semibold ring-1 ring-ink/15"
                        >
                          {t("Refuser")}
                        </button>
                        <button
                          type="button"
                          onClick={() => answer(n, true)}
                          className="h-10 rounded-xl bg-brand text-sm font-semibold text-white"
                        >
                          {t("Accepter")}
                        </button>
                      </div>
                    )}
                    {n.kind === "friend_request" && result && (
                      <p className="px-3 pb-2.5 text-xs font-semibold text-ink/60">{t(ANSWER_LABEL[result])}</p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
