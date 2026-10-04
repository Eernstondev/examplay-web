import Link from "next/link";
import { site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-ink/10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-5 py-8 text-sm text-ink/70 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p>
          © {new Date().getFullYear()} {site.name}. {site.slogan}.
        </p>
        <nav aria-label="Liens du pied de page" className="flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/confidentialite" className="hover:text-brand">
            Confidentialité
          </Link>
          <Link href="/conditions" className="hover:text-brand">
            Conditions d&apos;utilisation
          </Link>
          <a href={`mailto:${site.email}`} className="hover:text-brand">
            {site.email}
          </a>
        </nav>
      </div>
    </footer>
  );
}
