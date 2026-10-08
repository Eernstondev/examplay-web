import * as Sentry from "@sentry/nextjs";

// Suivi des erreurs dans le navigateur : actif seulement si NEXT_PUBLIC_SENTRY_DSN est défini.
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
if (dsn) Sentry.init({ dsn, tracesSampleRate: 0 });

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
