"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

// Présence « en ligne » : un seul canal pour tout le monde, identique à l'app mobile
// (lib/presence.ts). Ainsi un ami est visible même s'il est dans un autre département
// ou un autre niveau ; le filtrage se fait ensuite à l'affichage.
export type OnlinePlayer = { id: string; name: string; department: string; level: string };
export type Me = { id: string; name: string; department: string; level: string };

export type DuelRow = {
  id: string;
  challenger: string;
  opponent: string;
  subject_id: string;
  seed: number;
  status: "pending" | "accepted" | "declined" | "finished" | "cancelled";
  challenger_score: number;
  opponent_score: number;
  challenger_done: boolean;
  opponent_done: boolean;
  challenger_forfeit: boolean;
  opponent_forfeit: boolean;
  winner: string | null;
  created_at: string;
  updated_at: string;
};

const SHOW_ONLINE_KEY = "examplay:showOnline";
const PRESENCE_CHANNEL = "online:all";
let channel: RealtimeChannel | null = null;
let current: OnlinePlayer[] = [];
// Les démarrages et arrêts de présence passent dans une file : rouvrir un canal de même nom
// avant la fin de la fermeture du précédent le laissait à moitié abonné (personne n'apparaissait).
let queue: Promise<void> = Promise.resolve();
const presenceListeners = new Set<(l: OnlinePlayer[]) => void>();
const duelListeners = new Set<(row: DuelRow) => void>();

const emitPresence = () => presenceListeners.forEach((cb) => cb(current));
const enqueue = (task: () => Promise<void>) => {
  queue = queue.then(task, task).catch(() => {});
  return queue;
};

export function onPresence(cb: (l: OnlinePlayer[]) => void) {
  presenceListeners.add(cb);
  cb(current);
  return () => {
    presenceListeners.delete(cb);
  };
}

export const onDuelUpdate = (cb: (row: DuelRow) => void) => {
  duelListeners.add(cb);
  return () => {
    duelListeners.delete(cb);
  };
};
export const emitDuelUpdate = (row: DuelRow) => duelListeners.forEach((cb) => cb(row));

export function getShowOnline(): boolean {
  try {
    return localStorage.getItem(SHOW_ONLINE_KEY) !== "0";
  } catch {
    return true;
  }
}

export function setShowOnline(value: boolean) {
  try {
    localStorage.setItem(SHOW_ONLINE_KEY, value ? "1" : "0");
  } catch {}
}

async function closeChannel() {
  const ch = channel;
  channel = null;
  current = [];
  emitPresence();
  if (!ch) return;
  try {
    await ch.untrack();
  } catch {}
  await createClient().removeChannel(ch);
}

export const stopPresence = () => enqueue(closeChannel);

export const syncPresence = (me: Me) =>
  enqueue(async () => {
    if (!getShowOnline()) return closeChannel();
    if (channel) return;
    const ch = createClient().channel(PRESENCE_CHANNEL, { config: { presence: { key: me.id } } });
    channel = ch;
    ch.on("presence", { event: "sync" }, () => {
      const state = ch.presenceState() as Record<string, { name?: string; department?: string; level?: string }[]>;
      current = Object.entries(state)
        .filter(([key]) => key !== me.id)
        .map(([key, value]) => ({
          id: key,
          name: value[0]?.name ?? "",
          department: value[0]?.department ?? "",
          level: value[0]?.level ?? "",
        }))
        .filter((p) => p.name);
      emitPresence();
    }).subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await ch.track({ name: me.name, avatar: null, department: me.department, level: me.level });
      }
    });
  });

const MESSAGES: [string, string][] = [
  ["not friends", "Vous devez d'abord être amis pour vous défier. Envoie-lui une demande d'ami."],
  ["already pending", "Défi déjà envoyé, patiente un instant."],
  ["not eligible", "Ce joueur n'est pas dans ton département ou ton niveau."],
  ["unavailable", "Ce défi n'est plus disponible."],
  ["too early", "Ton adversaire est encore en train de jouer."],
  ["not done", "Termine ta partie avant de quitter."],
];
export const duelError = (message: string) =>
  MESSAGES.find(([key]) => message.includes(key))?.[1] ??
  "Impossible de charger. Vérifie ta connexion.";
