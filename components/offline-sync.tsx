"use client";

import { useEffect } from "react";
import { flushQueue, prefetchBank, setUid } from "@/lib/offline";

type Props = { userId: string; level: string; subjects: { id: string; name: string }[] };

// Monté une fois dans le tableau de bord : enregistre le service worker, garde des
// questions pour le hors-ligne et envoie les résultats mis de côté sans connexion.
export function OfflineSync({ userId, level, subjects }: Props) {
  const subjectsKey = subjects.map((s) => `${s.id}:${s.name}`).join("|");

  useEffect(() => {
    setUid(userId);
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {});
    }
    const sync = () => void flushQueue(userId);
    sync();
    void prefetchBank(
      subjectsKey.split("|").map((p) => {
        const i = p.indexOf(":");
        return { id: p.slice(0, i), name: p.slice(i + 1) };
      }),
      level,
    );
    window.addEventListener("online", sync);
    return () => window.removeEventListener("online", sync);
  }, [userId, level, subjectsKey]);

  return null;
}
