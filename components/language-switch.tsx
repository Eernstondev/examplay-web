"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useLang, useT } from "@/components/i18n-provider";
import { LANG_COOKIE, type Lang } from "@/lib/i18n/core";
import { createClient } from "@/lib/supabase/client";

const OPTIONS: { id: Lang; label: string }[] = [
  { id: "fr", label: "Français" },
  { id: "ht", label: "Kreyòl" },
];

function useSetLang() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const set = (lang: Lang) => {
    document.cookie = `${LANG_COOKIE}=${lang}; path=/; max-age=31536000; samesite=lax`;
    start(() => router.refresh());
    // Langue des notifications envoyées par le serveur (ignoré si personne n'est connecté).
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) supabase.rpc("set_language", { p_lang: lang }).then(() => {});
    });
  };
  return [set, pending] as const;
}

// Bouton compact (en-têtes) : bascule FR / KR.
export function LanguageButton() {
  const lang = useLang();
  const t = useT();
  const [set, pending] = useSetLang();
  const next: Lang = lang === "fr" ? "ht" : "fr";
  return (
    <button
      type="button"
      onClick={() => set(next)}
      disabled={pending}
      aria-label={next === "ht" ? "Pase an kreyòl" : "Passer en français"}
      title={t("Langue")}
      className="grid size-11 place-items-center rounded-lg border border-ink/15 text-sm font-bold text-ink/80 hover:text-brand-fg disabled:opacity-60"
    >
      {next === "ht" ? "KR" : "FR"}
    </button>
  );
}

// Choix complet (page Profil).
export function LanguageSwitch() {
  const lang = useLang();
  const t = useT();
  const [set, pending] = useSetLang();
  return (
    <section className="mt-5 rounded-3xl bg-surface p-5 ring-1 ring-ink/10">
      <p className="font-display text-lg font-semibold">{t("Langue")}</p>
      <p className="mt-1 text-sm text-ink/65">
        {t("Les questions et les leçons restent en français, comme aux examens officiels.")}
      </p>
      <div role="radiogroup" aria-label={t("Langue")} className="mt-3 grid grid-cols-2 gap-1.5 rounded-2xl bg-ink/5 p-1.5">
        {OPTIONS.map((o) => (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={lang === o.id}
            disabled={pending}
            onClick={() => set(o.id)}
            className="h-11 rounded-xl text-sm font-bold text-ink/70 aria-checked:bg-brand aria-checked:text-white"
          >
            {o.label}
          </button>
        ))}
      </div>
    </section>
  );
}
