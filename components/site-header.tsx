"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LanguageButton } from "@/components/language-switch";
import { ThemeButton } from "@/components/theme-toggle";
import { navLinks, site } from "@/lib/site";
import { useT } from "@/components/i18n-provider";

export function SiteHeader() {
  const t = useT();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // L'espace élève a sa propre barre.
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/admin") || pathname.startsWith("/contribuer")) return null;

  return (
    <header className="mx-auto w-full max-w-6xl px-5 py-4 sm:px-8 sm:py-5">
      <div className="flex items-center justify-between gap-6">
        <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="" width={40} height={40} priority className="rounded-[10px]" />
          <span className="text-xl font-semibold tracking-tight">{site.name}</span>
        </Link>

        <nav aria-label={t("Navigation principale")} className="hidden items-center gap-6 xl:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? "page" : undefined}
              className="whitespace-nowrap text-sm font-medium text-ink/70 hover:text-brand-fg aria-[current=page]:text-brand-fg"
            >
              {t(link.label)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {/* Langue et thème : dans la barre sur grand écran, dans le menu sinon. */}
          <div className="hidden items-center gap-2 xl:flex">
            <LanguageButton />
            <ThemeButton />
          </div>
          <Link
            href="/commencer"
            onClick={() => setOpen(false)}
            className="hidden whitespace-nowrap rounded-full bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark sm:block"
          >
            {t("Commencer")}
          </Link>
          <button
            type="button"
            aria-expanded={open}
            aria-controls="menu-mobile"
            aria-label={open ? t("Fermer") : t("Menu")}
            onClick={() => setOpen((v) => !v)}
            className="grid size-11 place-items-center rounded-lg text-ink/80 hover:text-brand-fg xl:hidden"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              {open ? (
                <path d="M6 6l12 12M18 6L6 18" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <nav
          id="menu-mobile"
          aria-label={t("Navigation mobile")}
          className="mt-4 grid border-t border-ink/10 pt-2 xl:hidden"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              aria-current={pathname === link.href ? "page" : undefined}
              className="border-b border-ink/10 py-3.5 font-medium aria-[current=page]:text-brand-fg"
            >
              {t(link.label)}
            </Link>
          ))}
          <div className="flex items-center justify-between border-b border-ink/10 py-2.5">
            <span className="font-medium">{t("Langue")}</span>
            <LanguageButton />
          </div>
          <div className="flex items-center justify-between border-b border-ink/10 py-2.5">
            <span className="font-medium">{t("Changer de thème")}</span>
            <ThemeButton />
          </div>
          <Link
            href="/commencer"
            onClick={() => setOpen(false)}
            className="mt-4 rounded-full bg-brand px-4 py-3 text-center font-medium text-white sm:hidden"
          >
            {t("Commencer")}
          </Link>
        </nav>
      )}
    </header>
  );
}
