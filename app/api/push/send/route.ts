import { createHash, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

// Appelé par un webhook de base de données à chaque nouvelle ligne de `notifications`.
// Corps attendu : { type: "INSERT", table: "notifications", record: { user_id, kind, data } }.
// Protégé par `Authorization: Bearer <PUSH_WEBHOOK_SECRET>`.

type Notif = { user_id: string; kind: string; data?: Record<string, unknown> };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function digest(value: string) {
  return createHash("sha256").update(value).digest();
}

function message(n: Notif): { title: string; body: string; url: string; tag: string } | null {
  const d = n.data ?? {};
  switch (n.kind) {
    case "duel_challenge":
      return {
        title: "Nouveau duel",
        body: `${typeof d.from_name === "string" && d.from_name ? d.from_name : "Un élève"} te défie en duel.`,
        url: "/dashboard/communaute",
        tag: `duel-${String(d.duel_id ?? "")}`,
      };
    case "duel_finished":
      return {
        title: "Duel terminé",
        body: d.won === true ? "Tu as gagné ton duel !" : "Le résultat de ton duel est prêt.",
        url: "/dashboard/communaute",
        tag: `duel-end-${String(d.duel_id ?? "")}`,
      };
    case "report_resolved":
      return {
        title: "Signalement traité",
        body: "Ton signalement a reçu une réponse.",
        url: "/dashboard",
        tag: `report-${String(d.report_id ?? "")}`,
      };
    default:
      return null;
  }
}

export async function POST(request: Request) {
  const secret = process.env.PUSH_WEBHOOK_SECRET;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT;
  if (!secret || !serviceKey || !vapidPublic || !vapidPrivate || !vapidSubject) {
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

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: subs, error } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", record.user_id);
  if (error) {
    console.error("push: lecture des abonnements impossible", error.code, error.message);
    return Response.json({ error: "database" }, { status: 500 });
  }
  if (!subs?.length) return Response.json({ sent: 0 });

  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);
  const json = JSON.stringify(payload);
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

  return Response.json({ sent: outcomes.filter((o) => o.status === "fulfilled").length, removed: gone.length });
}
