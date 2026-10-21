"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function ReferralPage() {
  const params = useParams<{ code: string }>();
  const code = (params?.code ?? "").toUpperCase();
  const [tried, setTried] = useState(false);

  useEffect(() => {
    if (!code) return;
    const timer = setTimeout(() => setTried(true), 1500);
    window.location.href = `examplay://r/${code}`;
    return () => clearTimeout(timer);
  }, [code]);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "#eef2f9",
      }}
    >
      <div
        style={{
          maxWidth: 420,
          width: "100%",
          background: "#fff",
          borderRadius: 20,
          padding: 32,
          textAlign: "center",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        <h1 style={{ fontSize: 22, color: "#1b2540", marginBottom: 12 }}>
          Code de parrainage Examplay
        </h1>
        <p style={{ fontSize: 15, color: "#4a5573", marginBottom: 20 }}>
          {tried
            ? "Ouvre l'app Examplay, puis colle ce code dans le champ « Code de parrainage » à l'inscription."
            : "Ouverture de l'app..."}
        </p>
        <div
          style={{
            background: "#eef3fc",
            border: "1px solid #d3e0f6",
            borderRadius: 14,
            padding: "22px 12px",
            marginBottom: 20,
          }}
        >
          <div
            style={{
              fontFamily: "'Courier New', Courier, monospace",
              fontSize: 32,
              fontWeight: 700,
              letterSpacing: 6,
              color: "#1b2540",
            }}
          >
            {code}
          </div>
        </div>
        <p style={{ fontSize: 13, color: "#6b7694" }}>
          L'app n'est pas encore sur le Play Store — elle arrive très bientôt.
        </p>
      </div>
    </main>
  );
}
