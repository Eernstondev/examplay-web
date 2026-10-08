// Serveur uniquement : lit SENTRY_AUTH_TOKEN (jamais préfixé NEXT_PUBLIC, donc absent du navigateur).
export type SentryIssue = {
  id: string;
  title: string;
  culprit: string;
  count: number;
  userCount: number;
  firstSeen: string;
  lastSeen: string;
  level: string;
  permalink: string;
};

export type IssuesResult =
  | { status: "unconfigured" }
  | { status: "error"; message: string }
  | { status: "ok"; issues: SentryIssue[] };

const HOST = "https://sentry.io";

// Erreurs non résolues des 14 derniers jours (lecture seule, jeton gardé côté serveur).
export async function getIssues(limit = 30): Promise<IssuesResult> {
  const token = process.env.SENTRY_AUTH_TOKEN;
  const org = process.env.SENTRY_ORG;
  if (!token || !org) return { status: "unconfigured" };

  const url = new URL(`${HOST}/api/0/organizations/${encodeURIComponent(org)}/issues/`);
  url.searchParams.set("query", "is:unresolved");
  url.searchParams.set("statsPeriod", "14d");
  url.searchParams.set("sort", "date");
  url.searchParams.set("limit", String(limit));
  const project = process.env.SENTRY_PROJECT_ID;
  if (project) url.searchParams.set("project", project);

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(8000),
    });
    if (res.status === 401 || res.status === 403) {
      return { status: "error", message: "Sentry a refusé la clé. Vérifie SENTRY_AUTH_TOKEN et ses permissions." };
    }
    if (!res.ok) return { status: "error", message: `Sentry a répondu avec une erreur (${res.status}).` };
    const rows = (await res.json()) as Record<string, unknown>[];
    return {
      status: "ok",
      issues: rows.map((r) => ({
        id: String(r.id),
        title: String(r.title ?? "Erreur"),
        culprit: String(r.culprit ?? ""),
        count: Number(r.count ?? 0),
        userCount: Number(r.userCount ?? 0),
        firstSeen: String(r.firstSeen ?? ""),
        lastSeen: String(r.lastSeen ?? ""),
        level: String(r.level ?? "error"),
        permalink: String(r.permalink ?? ""),
      })),
    };
  } catch {
    return { status: "error", message: "Sentry n'a pas répondu. Réessaie dans un instant." };
  }
}

export type Explanation = { what: string; action: string; urgent: boolean };

// Explication en français pour les erreurs les plus courantes.
export function explain(issue: Pick<SentryIssue, "title" | "culprit" | "userCount">): Explanation {
  const t = issue.title.toLowerCase();
  const many = issue.userCount >= 5;

  if (/failed to fetch|networkerror|load failed|network request failed|fetch failed/.test(t)) {
    return {
      what: "La connexion de l'élève s'est coupée pendant un chargement. C'est courant avec un réseau faible.",
      action: "Rien à corriger en général. Surveille seulement si le nombre d'élèves touchés monte vite.",
      urgent: false,
    };
  }
  if (/chunkloaderror|loading chunk|loading css chunk|importing a module script failed/.test(t)) {
    return {
      what: "L'élève avait encore l'ancienne version du site ouverte après une mise à jour.",
      action: "Aucune action : recharger la page règle le problème.",
      urgent: false,
    };
  }
  if (/hydrat|text content does not match|did not match/.test(t)) {
    return {
      what: "Ce que le serveur a affiché ne correspond pas à ce que le navigateur a recalculé. Souvent causé par une extension du navigateur ou une date/heure.",
      action: many
        ? "Plusieurs élèves sont touchés : envoie-moi le lien Sentry pour que je cherche la cause."
        : "Peu grave si c'est rare. Envoie-moi le lien Sentry s'il revient souvent.",
      urgent: many,
    };
  }
  if (/resizeobserver|non-error promise rejection|script error/.test(t)) {
    return {
      what: "Alerte technique du navigateur, sans effet visible pour l'élève.",
      action: "Tu peux l'ignorer.",
      urgent: false,
    };
  }
  if (/cannot read propert|undefined is not an object|null is not an object|is not a function|is not defined/.test(t)) {
    return {
      what: "Le code a essayé d'utiliser une donnée qui n'existait pas encore ou qui manquait. C'est un défaut du code.",
      action: "À corriger. Envoie-moi le lien Sentry : l'endroit exact est indiqué.",
      urgent: true,
    };
  }
  if (/jwt|auth|session|refresh token/.test(t)) {
    return {
      what: "Problème de connexion au compte : la session de l'élève a expiré ou n'est plus valide.",
      action: "Normal de temps en temps. Si ça touche beaucoup d'élèves, envoie-moi le lien Sentry.",
      urgent: many,
    };
  }
  return {
    what: "Erreur inattendue, pas encore classée.",
    action: "Ouvre-la dans Sentry et envoie-moi le lien : je t'explique la cause et la correction.",
    urgent: many,
  };
}
