"use client";

import { useEffect, useRef, useState } from "react";
import type { Ad } from "@/lib/ads";
import { createClient } from "@/lib/supabase/client";

const CLOSE_DELAY_MS = 5000;

// Affiche une publicité ; le bouton de fermeture apparaît après quelques secondes.
export function AdView({ ad, className = "" }: { ad: Ad; className?: string }) {
  const [closed, setClosed] = useState(false);
  const [canClose, setCanClose] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setCanClose(true), CLOSE_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  // Un affichage compté par chargement de la publicité.
  useEffect(() => {
    createClient().rpc("ad_view", { p_id: ad.id }).then(() => {});
  }, [ad.id]);

  // La vidéo n'est téléchargée et lancée que lorsqu'elle est visible à l'écran,
  // et jamais automatiquement si le téléphone est en mode économie de données.
  const video = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const el = video.current;
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    if (!el || saveData) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) el.play().catch(() => {});
        else el.pause();
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Plein écran : on empêche la page de défiler derrière l'overlay tant qu'il est ouvert.
  const fullscreen = ad.display_mode === "fullscreen";
  useEffect(() => {
    if (!fullscreen || closed) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [fullscreen, closed]);

  if (closed) return null;

  const href = `/pub/${ad.id}`;
  const frame =
    ad.display_mode === "carre"
      ? "aspect-square w-full rounded-2xl object-cover ring-1 ring-ink/10"
      : fullscreen
        ? "max-h-[80vh] w-full rounded-2xl object-contain"
        : "aspect-[3/1] w-full rounded-2xl object-cover ring-1 ring-ink/10";

  const media =
    ad.media_type === "video" ? (
      <video
        src={ad.image_url}
        ref={video}
        aria-label={ad.title}
        muted
        loop
        playsInline
        controls
        preload="none"
        className={`${frame} bg-ink`}
      />
    ) : ad.link_url ? (
      <a href={href} target="_blank" rel="sponsored noopener" className="block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={ad.image_url} alt={ad.title} loading="lazy" decoding="async" className={frame} />
      </a>
    ) : (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={ad.image_url} alt={ad.title} loading="lazy" decoding="async" className={frame} />
    );

  const closeButton = canClose && (
    <button
      type="button"
      onClick={() => setClosed(true)}
      aria-label="Fermer la publicité"
      className="absolute right-2 top-2 grid size-11 place-items-center rounded-full bg-ink/80 text-white backdrop-blur hover:bg-ink"
    >
      <svg viewBox="0 0 20 20" aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
        <path d="M5 5l10 10M15 5 5 15" />
      </svg>
    </button>
  );

  const learnMore = ad.media_type === "video" && ad.link_url && (
    <a
      href={href}
      target="_blank"
      rel="sponsored noopener"
      className="mt-2 flex h-12 items-center justify-center rounded-xl bg-brand font-bold text-white hover:bg-brand-dark"
    >
      En savoir plus
    </a>
  );

  // Plein écran : la publicité recouvre toute la page, quel que soit l'endroit où
  // <AdSlot> est placé dans le flux (position fixe, par-dessus tout le reste).
  if (fullscreen) {
    return (
      <div role="dialog" aria-modal="true" aria-label="Publicité" className="fixed inset-0 z-50 grid place-items-center bg-ink/80 p-4">
        <div className="relative w-full max-w-lg">
          {media}
          {closeButton}
          {learnMore}
        </div>
      </div>
    );
  }

  return (
    <aside aria-label="Publicité" className={className}>
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink/50">Publicité</p>
      <div className="relative">
        {media}
        {closeButton}
      </div>
      {learnMore}
    </aside>
  );
}
