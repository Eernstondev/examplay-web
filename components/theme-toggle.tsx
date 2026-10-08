"use client";

import { useSyncExternalStore } from "react";

type Theme = "system" | "light" | "dark";

const KEY = "theme";
const EVENT = "theme-change";

const OPTIONS: { id: Theme; label: string }[] = [
  { id: "light", label: "Clair" },
  { id: "dark", label: "Sombre" },
  { id: "system", label: "Auto" },
];

function read(): Theme {
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}

function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(EVENT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(EVENT, cb);
  };
}

function apply(theme: Theme) {
  const root = document.documentElement;
  if (theme === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
  try {
    if (theme === "system") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, theme);
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}

function useTheme() {
  return useSyncExternalStore(subscribe, read, () => "system" as Theme);
}

// Choix clair / sombre / auto (suit le système).
export function ThemeSwitch() {
  const theme = useTheme();
  return (
    <section className="mt-5 rounded-3xl bg-surface p-5 ring-1 ring-ink/10">
      <p className="font-display text-lg font-semibold">Apparence</p>
      <p className="mt-1 text-sm text-ink/65">« Auto » suit le réglage de ton appareil.</p>
      <div role="radiogroup" aria-label="Thème" className="mt-3 grid grid-cols-3 gap-1.5 rounded-2xl bg-ink/5 p-1.5">
        {OPTIONS.map((o) => (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={theme === o.id}
            onClick={() => apply(o.id)}
            className="h-11 rounded-xl text-sm font-bold text-ink/70 aria-checked:bg-brand aria-checked:text-white"
          >
            {o.label}
          </button>
        ))}
      </div>
    </section>
  );
}

// Bouton compact (en-tête public) : alterne clair / sombre selon ce qui est affiché.
export function ThemeButton() {
  useTheme();
  const toggle = () => {
    const root = document.documentElement;
    const dark =
      root.getAttribute("data-theme") === "dark" ||
      (!root.hasAttribute("data-theme") && matchMedia("(prefers-color-scheme: dark)").matches);
    apply(dark ? "light" : "dark");
  };
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Changer de thème"
      className="grid size-11 place-items-center rounded-lg border border-ink/15 text-ink/80 hover:text-brand-fg"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
      </svg>
    </button>
  );
}
