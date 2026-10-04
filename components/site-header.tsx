"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { navLinks, site } from "@/lib/site";

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="mx-auto w-full max-w-6xl px-5 py-4 sm:px-8 sm:py-5">
      <div className="flex items-center justify-between gap-6">
        <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="" width={40} height={40} priority className="rounded-[10px]" />
          <span className="font-display text-xl font-bold tracking-tight">{site.name}</span>
        </Link>

        <nav aria-label="Navigation principale" className="hidden items-center gap-6 xl:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? "page" : undefined}
              className="whitespace-nowrap text-sm font-medium text-ink/70 hover:text-brand aria-[current=page]:text-brand"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/#inscription"
            onClick={() => setOpen(false)}
            className="hidden whitespace-nowrap rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark sm:block"
          >
            Me prévenir au lancement
          </Link>
          <button
            type="button"
            aria-expanded={open}
            aria-controls="menu-mobile"
            onClick={() => setOpen((v) => !v)}
            className="min-h-11 rounded-lg border border-ink/15 px-4 text-sm font-semibold xl:hidden"
          >
            {open ? "Fermer" : "Menu"}
          </button>
        </div>
      </div>

      {open && (
        <nav
          id="menu-mobile"
          aria-label="Navigation mobile"
          className="mt-4 grid border-t border-ink/10 pt-2 xl:hidden"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              aria-current={pathname === link.href ? "page" : undefined}
              className="border-b border-ink/10 py-3.5 font-medium aria-[current=page]:text-brand"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/#inscription"
            onClick={() => setOpen(false)}
            className="mt-4 rounded-lg bg-brand px-4 py-3 text-center font-semibold text-white sm:hidden"
          >
            Me prévenir au lancement
          </Link>
        </nav>
      )}
    </header>
  );
}
