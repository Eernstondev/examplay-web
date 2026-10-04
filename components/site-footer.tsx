import Image from "next/image";
import Link from "next/link";
import { SocialIcon } from "@/components/social-icon";
import { navLinks, site, socials } from "@/lib/site";

const networks = [...socials, { label: "WhatsApp", href: site.whatsapp }];
const heading = "font-display text-base font-semibold text-white";
const item = "inline-block py-1.5 text-white/70 hover:text-white";

export function SiteFooter() {
  return (
    <footer className="mt-4 rounded-t-[2rem] bg-ink text-white sm:mx-4 sm:rounded-t-[2.5rem] lg:mx-6">
      <div className="mx-auto w-full max-w-6xl px-5 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-12 sm:px-8 sm:pt-16">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_2fr] lg:gap-16">
          <div>
            <Link href="/" className="inline-flex items-center gap-3">
              <Image src="/logo.png" alt="" width={48} height={48} className="rounded-xl" />
              <span className="font-display text-2xl font-bold tracking-tight">{site.name}</span>
            </Link>
            <p className="mt-4 max-w-xs font-display text-xl font-semibold leading-snug text-white/90">
              {site.slogan}.
            </p>
            <ul className="mt-6 flex gap-3">
              {networks.map((n) => (
                <li key={n.label}>
                  <a
                    href={n.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${site.name} sur ${n.label}`}
                    className="grid size-12 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white hover:text-ink"
                  >
                    <SocialIcon name={n.label} className="size-5" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3">
            <nav aria-label="Pages du site">
              <h2 className={heading}>Examplay</h2>
              <ul className="mt-3">
                {navLinks.slice(1).map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className={item}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <nav aria-label="Compte">
              <h2 className={heading}>Réviser</h2>
              <ul className="mt-3">
                <li>
                  <Link href="/commencer" className={item}>
                    Commencer
                  </Link>
                </li>
                <li>
                  <Link href="/connexion" className={item}>
                    Connexion
                  </Link>
                </li>
              </ul>
            </nav>
            <nav aria-label="Informations légales" className="col-span-2 sm:col-span-1">
              <h2 className={heading}>Légal et contact</h2>
              <ul className="mt-3">
                <li>
                  <Link href="/confidentialite" className={item}>
                    Confidentialité
                  </Link>
                </li>
                <li>
                  <Link href="/conditions" className={item}>
                    Conditions d&apos;utilisation
                  </Link>
                </li>
                <li>
                  <a href={`mailto:${site.email}`} className={`${item} break-all`}>
                    {site.email}
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        <p className="mt-12 border-t border-white/15 pt-6 text-sm text-white/60">
          © {new Date().getFullYear()} URBVEC Atelier. Tous droits réservés.
        </p>
      </div>
    </footer>
  );
}
