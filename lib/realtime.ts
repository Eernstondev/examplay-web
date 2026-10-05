"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

// Présence « en ligne » : même canal et même format que l'app mobile (lib/presence.ts),
// pour que les élèves du site et de l'app se voient entre eux.
export type OnlinePlayer = { id: string; name: string };
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
let channel: RealtimeChannel | null = null;
let current: OnlinePlayer[] = [];
const presenceListeners = new Set<(l: OnlinePlayer[]) => void>();
const duelListeners = new Set<(row: DuelRow) => void>();

const emitPresence = () => presenceListeners.forEach((cb) => cb(current));
const slug = (s: string) => s.normalize("NFD").replace(/[^\w]+/g, "_");

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

export async function stopPresence() {
  const ch = channel;
  channel = null;
  current = [];
  emitPresence();
  if (ch) await createClient().removeChannel(ch);
}

export async function syncPresence(me: Me) {
  if (!getShowOnline()) return stopPresence();
  if (channel) return;
  const supabase = createClient();
  const name = `online:${slug(me.department)}:${me.level === "9e" ? "9e" : "ns4"}`;
  const ch = supabase.channel(name, { config: { presence: { key: me.id } } });
  channel = ch;
  ch.on("presence", { event: "sync" }, () => {
    const state = ch.presenceState() as Record<string, { name?: string }[]>;
    current = Object.entries(state)
      .filter(([key]) => key !== me.id)
      .map(([key, value]) => ({ id: key, name: value[0]?.name ?? "" }))
      .filter((p) => p.name);
    emitPresence();
  }).subscribe(async (status) => {
    if (status === "SUBSCRIBED") await ch.track({ name: me.name, avatar: null });
  });
}

const MESSAGES: [string, string][] = [
  ["already pending", "Défi déjà envoyé, patiente un instant."],
  ["not eligible", "Ce joueur n'est pas dans ton département ou ton niveau."],
  ["unavailable", "Ce défi n'est plus disponible."],
  ["too early", "Ton adversaire est encore en train de jouer."],
  ["not done", "Termine ta partie avant de quitter."],
];
export const duelError = (message: string) =>
  MESSAGES.find(([key]) => message.includes(key))?.[1] ??
  "Impossible de charger. Vérifie ta connexion.";
