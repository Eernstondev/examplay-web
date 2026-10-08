"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

// Dernier filet : erreur dans le layout racine (app/error.tsx ne l'attrape pas).
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="fr">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", color: "#0b2559", background: "#fff" }}>
        <main style={{ maxWidth: 420, margin: "0 auto", padding: "96px 20px", textAlign: "center" }}>
          <h1 style={{ fontSize: 28, lineHeight: 1.2 }}>Cette page n&apos;a pas pu se charger</h1>
          <p style={{ lineHeight: 1.6 }}>Vérifie ta connexion Internet, puis réessaie.</p>
          <button
            type="button"
            onClick={reset}
            style={{ marginTop: 16, height: 52, width: "100%", border: 0, borderRadius: 12, background: "#1746a2", color: "#fff", fontSize: 16, fontWeight: 700 }}
          >
            Réessayer
          </button>
        </main>
      </body>
    </html>
  );
}
