"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Vue d'ensemble" },
  { href: "/admin/questions", label: "Questions" },
  { href: "/admin/signalements", label: "Signalements" },
  { href: "/admin/propositions", label: "Propositions" },
  { href: "/admin/chapitres", label: "Chapitres" },
  { href: "/admin/partenaires", label: "Partenaires" },
  { href: "/admin/publicites", label: "Publicités" },
  { href: "/admin/utilisateurs", label: "Utilisateurs" },
  { href: "/admin/contributeurs", label: "Contributeurs" },
  { href: "/admin/messages", label: "Messages" },
  { href: "/admin/erreurs", label: "Erreurs" },
];

export function AdminNav({ counts = {} }: { counts?: Record<string, number> }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Administration" className="mx-auto w-full max-w-6xl overflow-x-auto px-5 sm:px-8">
      <ul className="flex w-max gap-1">
        {links.map((link) => {
          const current = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={current ? "page" : undefined}
                className="grid h-11 place-items-center whitespace-nowrap border-b-2 border-transparent px-3 text-sm font-semibold text-ink/65 hover:text-brand-fg aria-[current=page]:border-brand aria-[current=page]:text-brand-fg"
              >
                <span>
                  {link.label}
                  {counts[link.href] > 0 && (
                    <span className="ml-1.5 rounded-full bg-danger px-1.5 py-0.5 text-xs font-bold text-white">
                      {counts[link.href]}
                    </span>
                  )}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
