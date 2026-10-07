"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

type TurnstileApi = {
  render: (el: HTMLElement, options: { sitekey: string; language: string }) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
};
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

// Contrôle anti-robots ; ajoute le champ `cf-turnstile-response` au formulaire parent.
// `resetKey` : à faire changer après chaque envoi, un jeton ne servant qu'une fois.
export function Turnstile({ resetKey }: { resetKey?: unknown }) {
  const box = useRef<HTMLDivElement>(null);
  const widget = useRef<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!ready || !box.current || !window.turnstile || !SITE_KEY) return;
    const api = window.turnstile;
    const id = api.render(box.current, { sitekey: SITE_KEY, language: "fr" });
    widget.current = id;
    return () => {
      widget.current = null;
      api.remove(id);
    };
  }, [ready]);

  useEffect(() => {
    if (widget.current) window.turnstile?.reset(widget.current);
  }, [resetKey]);

  if (!SITE_KEY) return null;

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={() => setReady(true)}
      />
      <div ref={box} className="min-h-[65px]" />
    </>
  );
}
