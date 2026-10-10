import { createHash, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

// Appelé par un webhook de base de données à chaque nouvelle ligne de `notifications`.
// Corps attendu : { type: "INSERT", table: "notifications", record: { user_id, kind, data } }.
// Protégé par `Authorization: Bearer <PUSH_WEBHOOK_SECRET>`.
// Envoie aux navigateurs abonnés (web-push) et aux téléphones enregistrés (Expo Push).

type Notif = { user_id: string; kind: string; data?: Record<string, unknown> };
type Payload = { title: string; body: string; url: string; tag: string; screen: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EXPO_URL = "https://exp.host/--/api/v2/push/send";

function digest(value: string) {
  return createHash("sha256").update(value).digest();
}

function message(n: Notif): Payload | null {
  const d = n.data ?? {};
  const from = typeof d.from_name === "string" && d.from_name ? d.from_name : "Un élève";
  switch (n.kind) {
    case "duel_challenge":
      return {
        title: "Nouveau duel",
        body: `${from} te défie en duel.`,
        url: "/dashboard/communaute",
        tag: `duel-${String(d.duel_id ?? "")}`,
        screen: "/", // l'invitation s'affiche en bannière à l'ouverture de l'app
      };
    case "duel_finished":
      return {
        title: "Duel terminé",
        body: d.won === true ? "Tu as gagné ton duel !" : "Le résultat de ton duel est prêt.",
        url: "/dashboard/communaute",
        tag: `duel-end-${String(d.duel_id ?? "")}`,
        screen: "/notifications",
      };
    case "friend_request":
      return {
        title: "Demande d'ami",
        body: `${from} veut être ton ami.`,
        url: "/dashboard/communaute?tab=friends",
        tag: `friend-${String(d.request_id ?? "")}`,
        screen: "/notifications",
      };
    case "friend_accepted":
      return {
        title: "Nouvel ami",
        body: `${from} a accepté ta demande. Vous pouvez vous défier.`,
        url: "/dashboard/communaute?tab=friends",
        tag: `friend-ok-${String(d.from_id ?? "")}`,
        screen: "/notifications",
      };
    case "report_resolved":
      return {
        title: "Signalement traité",
        body: "Ton signalement a reçu une réponse.",
        url: "/dashboard",
        tag: `report-${String(d.report_id ?? "")}`,
        screen: "/notifications",
      };
    default:
      return null;
  }
}

export async function POST(request: Request) {
  const secret = process.env.PUSH_WEBHOOK_SECRET;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret || !serviceKey) {
    console.error("push: variables d'environnement manquantes");
    return Response.json({ error: "not configured" }, { status: 503 });
  }

  const header = request.headers.get("authorization") ?? "";
  const given = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!timingSafeEqual(digest(given), digest(secret))) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    type?: string;
    table?: string;
    record?: Notif;
  } | null;
  const record = body?.record;
  if (
    body?.type !== "INSERT" ||
    body.table !== "notifications" ||
    !record ||
    typeof record.user_id !== "string" ||
    !UUID.test(record.user_id)
  ) {
    return Response.json({ error: "bad request" }, { status: 400 });
  }

  const payload = message(record);
  if (!payload) return Response.json({ sent: 0 });

  const supabase = serviceClient(serviceKey);

  const [web, phone] = await Promise.all([sendWeb(supabase, record.user_id, payload), sendPhone(supabase, record.user_id, payload)]);
  return Response.json({ sent: web.sent + phone.sent, removed: web.removed + phone.removed });
}

const serviceClient = (key: string) =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
type Db = ReturnType<typeof serviceClient>;
type Outcome = { sent: number; removed: number };

// Navigateurs (nécessite les clés VAPID ; sans elles, on passe simplement au téléphone).
async function sendWeb(supabase: Db, userId: string, payload: Payload): Promise<Outcome> {
  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT;
  if (!vapidPublic || !vapidPrivate || !vapidSubject) return { sent: 0, removed: 0 };

  const { data: subs, error } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId);
  if (error) {
    console.error("push: lecture des abonnements impossible", error.code, error.message);
    return { sent: 0, removed: 0 };
  }
  if (!subs?.length) return { sent: 0, removed: 0 };

  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);
  const json = JSON.stringify({ title: payload.title, body: payload.body, url: payload.url, tag: payload.tag });
  const outcomes = await Promise.allSettled(
    subs.map((s) =>
      webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, json, { TTL: 3600 }),
    ),
  );

  // 404 / 410 : l'appareil s'est désabonné, on nettoie.
  const gone = subs.filter((_, i) => {
    const o = outcomes[i];
    return o.status === "rejected" && [404, 410].includes((o.reason as { statusCode?: number }).statusCode ?? 0);
  });
  if (gone.length) {
    await supabase.from("push_subscriptions").delete().in("id", gone.map((s) => s.id));
  }
  return { sent: outcomes.filter((o) => o.status === "fulfilled").length, removed: gone.length };
}

// Téléphones (application Examplay) via le service Expo Push.
async function sendPhone(supabase: Db, userId: string, payload: Payload): Promise<Outcome> {
  const { data: tokens, error } = await supabase.from("push_tokens").select("id, token").eq("user_id", userId);
  if (error) {
    console.error("push: lecture des jetons impossible", error.code, error.message);
    return { sent: 0, removed: 0 };
  }
  if (!tokens?.length) return { sent: 0, removed: 0 };

  try {
    const res = await fetch(EXPO_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
        ...(process.env.EXPO_ACCESS_TOKEN ? { authorization: `Bearer ${process.env.EXPO_ACCESS_TOKEN}` } : {}),
      },
      body: JSON.stringify(
        tokens.map((t) => ({
          to: t.token,
          title: payload.title,
          body: payload.body,
          sound: "default",
          channelId: "default",
          priority: "high",
          ttl: 3600,
          data: { screen: payload.screen },
        })),
      ),
    });
    const json = (await res.json().catch(() => null)) as { data?: { status?: string; details?: { error?: string } }[] } | null;
    const tickets = json?.data ?? [];

    // Téléphone désinstallé / jeton périmé : on nettoie.
    const gone = tokens.filter((_, i) => tickets[i]?.details?.error === "DeviceNotRegistered");
    if (gone.length) {
      await supabase.from("push_tokens").delete().in("id", gone.map((t) => t.id));
    }
    return { sent: tickets.filter((t) => t.status === "ok").length, removed: gone.length };
  } catch (e) {
    console.error("push: envoi Expo impossible", e instanceof Error ? e.message : e);
    return { sent: 0, removed: 0 };
  }
}
