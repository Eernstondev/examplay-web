import Link from "next/link";
import { site, socials } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer data-hide-cta className="border-t border-ink/10">
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-5 pb-[calc(2.5rem+env(safe-area-inset-bottom))] pt-10 text-sm text-ink/70 sm:px-8 lg:grid-cols-[1fr_auto]">
        <div>
          <p className="font-display text-base font-semibold text-ink">{site.name}</p>
          <p className="mt-1">{site.slogan}.</p>
          <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
            {socials.map((s) => (
              <li key={s.label}>
                <a href={s.href} target="_blank" rel="noopener noreferrer" className="inline-block py-1 hover:text-brand">
                  {s.label}
                </a>
              </li>
            ))}
            <li>
              <a href={site.whatsapp} target="_blank" rel="noopener noreferrer" className="inline-block py-1 hover:text-brand">
                WhatsApp
              </a>
            </li>
          </ul>
        </div>
        <nav aria-label="Liens du pied de page" className="flex flex-wrap content-start gap-x-6 gap-y-2 lg:justify-end">
          <Link href="/confidentialite" className="inline-block py-1 hover:text-brand">
            Confidentialité
          </Link>
          <Link href="/conditions" className="inline-block py-1 hover:text-brand">
            Conditions d&apos;utilisation
          </Link>
          <a href={`mailto:${site.email}`} className="inline-block py-1 hover:text-brand">
            {site.email}
          </a>
        </nav>
        <p className="lg:col-span-2">
          © {new Date().getFullYear()} URBVEC Atelier. Tous droits réservés.
        </p>
      </div>
    </footer>
  );
}
