"use client";

import { useEffect, useState } from "react";
import { primaryButton, secondaryButton } from "@/components/app/ui";
import { createClient } from "@/lib/supabase/client";

type State = "loading" | "unsupported" | "denied" | "off" | "on" | "busy";

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function keyToBytes(base64: string) {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

// Active ou coupe les notifications push sur cet appareil (duel reçu, duel terminé, signalement traité).
export function PushToggle() {
  const [state, setState] = useState<State>("loading");
  const [ios, setIos] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const supported = !!PUBLIC_KEY && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
      setIos(/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.matchMedia("(display-mode: standalone)").matches);
      if (!supported) return alive && setState("unsupported");
      if (Notification.permission === "denied") return alive && setState("denied");
      const reg = await navigator.serviceWorker.getRegistration("/");
      const sub = await reg?.pushManager.getSubscription();
      let mine = false;
      if (sub) {
        // L'abonnement du navigateur peut venir d'un autre compte : on vérifie qu'il est bien au nôtre.
        const { data } = await createClient().from("push_subscriptions").select("id").eq("endpoint", sub.endpoint).maybeSingle();
        mine = !!data;
      }
      if (alive) setState(mine ? "on" : "off");
    })().catch(() => alive && setState("unsupported"));
    return () => {
      alive = false;
    };
  }, []);

  const enable = async () => {
    setState("busy");
    try {
      if ((await Notification.requestPermission()) !== "granted") return setState("denied");
      const reg = (await navigator.serviceWorker.getRegistration("/")) ?? (await navigator.serviceWorker.register("/sw.js", { scope: "/" }));
      await navigator.serviceWorker.ready;
      // Repart d'un abonnement neuf : évite de réutiliser celui d'un autre compte sur ce téléphone.
      await (await reg.pushManager.getSubscription())?.unsubscribe();
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyToBytes(PUBLIC_KEY!) });
      const json = sub.toJSON();
      const { error } = await createClient()
        .from("push_subscriptions")
        .insert({ endpoint: sub.endpoint, p256dh: json.keys?.p256dh, auth: json.keys?.auth });
      if (error) {
        await sub.unsubscribe();
        return setState("off");
      }
      setState("on");
    } catch {
      setState("off");
    }
  };

  const disable = async () => {
    setState("busy");
    try {
      const reg = await navigator.serviceWorker.getRegistration("/");
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await createClient().from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
        await sub.unsubscribe();
      }
      setState("off");
    } catch {
      setState("on");
    }
  };

  if (state === "unsupported") return null;

  return (
    <section className="mt-5 rounded-3xl bg-surface p-5 ring-1 ring-ink/10">
      <h2 className="font-display text-lg font-semibold">Notifications</h2>
      <p className="mt-1 text-sm leading-relaxed text-ink/65">
        Reçois une alerte sur ton téléphone quand on te défie en duel, quand un duel se termine ou quand ton signalement a une réponse.
      </p>
      {ios && state !== "on" && (
        <p className="mt-2 text-sm font-semibold text-ink/70">
          Sur iPhone : ajoute d&apos;abord Examplay à l&apos;écran d&apos;accueil (Partager, puis « Sur l&apos;écran d&apos;accueil »).
        </p>
      )}
      {state === "denied" ? (
        <p className="mt-3 text-sm font-semibold text-danger-fg">
          Les notifications sont bloquées. Autorise-les dans les réglages du navigateur pour ce site.
        </p>
      ) : state === "on" ? (
        <button type="button" onClick={disable} className={`${secondaryButton} mt-4 sm:max-w-xs`}>
          Désactiver les notifications
        </button>
      ) : (
        <button type="button" onClick={enable} disabled={state !== "off"} className={`${primaryButton} mt-4 sm:max-w-xs`}>
          {state === "busy" || state === "loading" ? "Patiente…" : "Activer les notifications"}
        </button>
      )}
    </section>
  );
}
