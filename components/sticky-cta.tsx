"use client";

import { useEffect, useState } from "react";

// Barre fixe en bas d'écran sur mobile, masquée dès qu'un formulaire
// d'inscription (ou le pied de page) est visible.
export function StickyCta() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const visible = new Set<Element>();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
      }
      setShow(visible.size === 0);
    });
    document.querySelectorAll("[data-hide-cta]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div
      aria-hidden={!show}
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-white/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur transition-transform duration-300 sm:hidden ${
        show ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <a
        href="#inscription"
        tabIndex={show ? 0 : -1}
        className="flex h-13 items-center justify-center rounded-xl bg-brand text-base font-bold text-white"
      >
        Me prévenir au lancement
      </a>
    </div>
  );
}
