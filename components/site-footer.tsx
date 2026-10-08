import Image from "next/image";
import Link from "next/link";
import { SocialIcon } from "@/components/social-icon";
import { site, socials } from "@/lib/site";

const networks = [...socials, { label: "WhatsApp", href: site.whatsapp }];
const links = [
  { label: "À propos", href: "/a-propos" },
  { label: "Nous contacter", href: "/contact" },
  { label: "Espace enseignants", href: "/contribuer" },
  { label: "Confidentialité", href: "/confidentialite" },
  { label: "Conditions", href: "/conditions" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-ink/10">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-5 px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-8 text-center sm:px-8 md:flex-row md:justify-between md:text-left">
        <div>
          <Link href="/" className="inline-flex items-center gap-2.5">
            <Image src="/logo.png" alt="" width={36} height={36} className="rounded-[9px]" />
            <span className="font-display text-lg font-bold tracking-tight">{site.name}</span>
          </Link>
          <p className="mt-2 text-xs text-ink/55">
            © {new Date().getFullYear()} URBVEC Atelier. Tous droits réservés.
          </p>
        </div>

        <nav aria-label="Liens du pied de page">
          <ul className="grid grid-cols-2 gap-x-8 text-sm font-medium md:flex md:gap-x-5">
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="inline-block py-2 text-ink/70 hover:text-brand-fg">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <ul className="flex gap-2">
          {networks.map((n) => (
            <li key={n.label}>
              <a
                href={n.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${site.name} sur ${n.label}`}
                className="grid size-11 place-items-center rounded-full bg-brand-soft text-brand-fg transition-colors hover:bg-brand hover:text-white"
              >
                <SocialIcon name={n.label} className="size-[18px]" />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
