"use client";

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useEffect } from "react";
import { useT } from "@/components/i18n-provider";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useT();
  useEffect(() => {
    console.error(error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-5 py-20 text-center">
      <h1 className="font-display text-[clamp(1.75rem,7vw,2.5rem)] font-extrabold leading-tight tracking-tight">
        {t("Cette page n'a pas pu se charger")}
      </h1>
      <p className="mt-3 max-w-md leading-relaxed text-ink/70">
        {t("Vérifie ta connexion Internet, puis réessaie. Tes résultats déjà enregistrés ne sont pas perdus.")}
      </p>
      <div className="mt-7 grid w-full max-w-xs gap-3">
        <button type="button" onClick={reset} className="h-13 rounded-xl bg-brand font-bold text-white hover:bg-brand-dark">
          {t("Réessayer")}
        </button>
        <Link href="/" className="grid h-13 place-items-center rounded-xl font-bold text-brand-fg ring-1 ring-ink/15">
          {t("Retour à l'accueil")}
        </Link>
      </div>
    </main>
  );
}
