"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { makeT, type Lang } from "@/lib/i18n/core";

const LangContext = createContext<Lang>("fr");

export function I18nProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  return <LangContext.Provider value={lang}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);

export function useT() {
  const lang = useLang();
  return useMemo(() => makeT(lang), [lang]);
}
