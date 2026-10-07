"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-5 py-20 text-center">
      <h1 className="font-display text-[clamp(1.75rem,7vw,2.5rem)] font-extrabold leading-tight tracking-tight">
        Cette page n&apos;a pas pu se charger
      </h1>
      <p className="mt-3 max-w-md leading-relaxed text-ink/70">
        Vérifie ta connexion Internet, puis réessaie. Tes résultats déjà enregistrés ne sont pas perdus.
      </p>
      <div className="mt-7 grid w-full max-w-xs gap-3">
        <button type="button" onClick={reset} className="h-13 rounded-xl bg-brand font-bold text-white hover:bg-brand-dark">
          Réessayer
        </button>
        <Link href="/" className="grid h-13 place-items-center rounded-xl font-bold text-brand ring-1 ring-ink/15">
          Retour à l&apos;accueil
        </Link>
      </div>
    </main>
  );
}
