import type { Metadata } from "next";
import { explain, getIssues } from "@/lib/sentry";

export const metadata: Metadata = { title: "Erreurs" };

const rtf = new Intl.RelativeTimeFormat("fr", { numeric: "auto" });

function ago(iso: string): string {
  const diff = (new Date(iso).getTime() - Date.now()) / 1000;
  if (!Number.isFinite(diff)) return "";
  const abs = Math.abs(diff);
  if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), "hour");
  return rtf.format(Math.round(diff / 86400), "day");
}

const card = "rounded-3xl bg-surface p-5 ring-1 ring-ink/10";

export default async function Page() {
  const result = await getIssues();

  return (
    <>
      <h1 className="font-display text-3xl font-extrabold tracking-tight">Erreurs du site</h1>
      <p className="mb-5 mt-2 max-w-2xl text-ink/70">
        Erreurs non résolues des 14 derniers jours, remontées par Sentry, avec une explication simple.
      </p>

      {result.status === "unconfigured" && (
        <div className={card}>
          <p className="font-semibold">Sentry n&apos;est pas encore relié.</p>
          <p className="mt-1 text-sm text-ink/70">
            Ajoute dans Vercel : <strong>SENTRY_AUTH_TOKEN</strong> (la clé de lecture) et <strong>SENTRY_ORG</strong>{" "}
            (le nom de l&apos;organisation, par exemple urbvec-group), puis redéploie.
          </p>
        </div>
      )}

      {result.status === "error" && (
        <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 text-sm font-semibold text-danger-fg">
          {result.message}
        </p>
      )}

      {result.status === "ok" &&
        (result.issues.length ? (
          <ul className="grid gap-3">
            {result.issues.map((issue) => {
              const e = explain(issue);
              const link = /^https:\/\/([a-z0-9-]+\.)*sentry\.io\//.test(issue.permalink) ? issue.permalink : null;
              return (
                <li key={issue.id} className={card}>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                    <span
                      className={`rounded-full px-2.5 py-1 ${e.urgent ? "bg-danger-soft text-danger-fg" : "bg-brand-soft text-brand-fg"}`}
                    >
                      {e.urgent ? "À corriger" : "À surveiller"}
                    </span>
                    <span className="text-ink/60">
                      {issue.userCount} élève{issue.userCount > 1 ? "s" : ""} · {issue.count} fois · dernière {ago(issue.lastSeen)}
                    </span>
                  </div>
                  <p className="mt-2 break-words font-semibold leading-snug">{issue.title}</p>
                  {issue.culprit && <p className="mt-0.5 break-all text-sm text-ink/55">{issue.culprit}</p>}
                  <p className="mt-3 text-sm">
                    <strong>Explication :</strong> {e.what}
                  </p>
                  <p className="mt-1 text-sm">
                    <strong>Que faire :</strong> {e.action}
                  </p>
                  {link && (
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-block text-sm font-semibold text-brand-fg underline underline-offset-4"
                    >
                      Ouvrir dans Sentry
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-8 text-center text-ink/70">Aucune erreur ces 14 derniers jours.</p>
        ))}
    </>
  );
}
