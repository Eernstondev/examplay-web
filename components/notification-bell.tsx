"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { subjectName } from "@/lib/content";
import { createClient } from "@/lib/supabase/client";

type Notif = {
  id: string;
  kind: "duel_challenge" | "duel_finished" | "report_resolved";
  data: Record<string, unknown>;
  read: boolean;
  created_at: string;
};

function describe(n: Notif): { text: string; href: string } {
  const d = n.data;
  if (n.kind === "duel_challenge") {
    return {
      text: `${(d.from_name as string) || "Un élève"} t'a défié en ${subjectName(String(d.subject_id))}.`,
      href: "/dashboard/communaute",
    };
  }
  if (n.kind === "duel_finished") {
    return {
      text: d.won
        ? `Tu as gagné ton duel en ${subjectName(String(d.subject_id))} !`
        : `Tu as perdu ton duel en ${subjectName(String(d.subject_id))}.`,
      href: "/dashboard/communaute",
    };
  }
  return {
    text: d.status === "resolved" ? "Ton signalement a été pris en compte." : "Ton signalement a été refusé.",
    href: "/dashboard",
  };
}

export function NotificationBell({ userId }: { userId: string }) {
  const [items, setItems] = useState<Notif[]>([]);
  const [open, setOpen] = useState(false);
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
        aria-label={unread ? `Notifications, ${unread} non lues` : "Notifications"}
        className="relative grid size-11 place-items-center rounded-full text-ink/70 hover:bg-surface hover:text-brand-fg"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 grid size-4 place-items-center rounded-full bg-danger text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-2 w-80 max-w-[90vw] rounded-2xl bg-surface p-2 shadow-xl ring-1 ring-ink/10">
          {items.length === 0 ? (
            <p className="p-4 text-center text-sm text-ink/60">Aucune notification pour le moment.</p>
          ) : (
            <ul className="max-h-96 overflow-y-auto">
              {items.map((n) => {
                const { text, href } = describe(n);
                return (
                  <li key={n.id}>
                    <Link
                      href={href}
                      onClick={() => setOpen(false)}
                      className={`block rounded-xl px-3 py-2.5 text-sm hover:bg-brand-soft ${n.read ? "text-ink/70" : "font-semibold text-ink"}`}
                    >
                      {text}
                    </Link>
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
