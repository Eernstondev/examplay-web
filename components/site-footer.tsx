import Image from "next/image";
import Link from "next/link";
import { SocialIcon } from "@/components/social-icon";
import { navLinks, site, socials } from "@/lib/site";

const networks = [...socials, { label: "WhatsApp", href: site.whatsapp }];
const links = [
  ...navLinks.slice(1),
  { label: "Confidentialité", href: "/confidentialite" },
  { label: "Conditions d'utilisation", href: "/conditions" },
];

export function SiteFooter() {
  return (
    <footer className="mt-4 rounded-t-[1.75rem] bg-ink text-white sm:mx-4 sm:rounded-t-[2rem] lg:mx-6">
      <div className="mx-auto w-full max-w-6xl px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-7 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <Image src="/logo.png" alt="" width={36} height={36} className="rounded-[9px]" />
            <span className="font-display text-lg font-bold tracking-tight">{site.name}</span>
          </Link>
          <ul className="flex gap-2">
            {networks.map((n) => (
              <li key={n.label}>
                <a
                  href={n.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${site.name} sur ${n.label}`}
                  className="grid size-11 place-items-center rounded-full bg-white/10 transition-colors hover:bg-white hover:text-ink"
                >
                  <SocialIcon name={n.label} className="size-[18px]" />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <nav aria-label="Liens du pied de page" className="mt-5">
          <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="inline-block py-1.5 text-white/70 hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <p className="mt-5 border-t border-white/15 pt-4 text-xs text-white/55">
          © {new Date().getFullYear()} URBVEC Atelier. Tous droits réservés.
        </p>
      </div>
    </footer>
  );
}
