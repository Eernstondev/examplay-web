import * as Sentry from "@sentry/nextjs";

// Suivi des erreurs côté serveur : actif seulement si NEXT_PUBLIC_SENTRY_DSN est défini.
export function register() {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;
  Sentry.init({ dsn, tracesSampleRate: 0 });
}

export const onRequestError = Sentry.captureRequestError;
