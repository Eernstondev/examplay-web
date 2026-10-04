import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { site, socials } from "@/lib/site";

export const metadata: Metadata = {
  title: "Nous contacter",
  description: "Joindre l'équipe Examplay par WhatsApp, e-mail ou sur les réseaux sociaux.",
};

const link = "font-semibold text-brand underline underline-offset-4";

export default function Page() {
  return (
    <PageShell
      title="Restons en contact"
      lead="Une question, une suggestion ou besoin d'assistance ? Notre équipe est à votre écoute pour faire progresser l'éducation ensemble."
    >
      <ul className="grid gap-x-12 gap-y-10 md:grid-cols-3">
        <li className="border-t-2 border-brand pt-5">
          <h2 className="font-display text-xl font-semibold">WhatsApp</h2>
          <p className="mt-2 leading-relaxed text-ink/70">
            Le moyen le plus rapide pour nous joindre directement.
          </p>
          <p className="mt-4">
            <a href={site.whatsapp} target="_blank" rel="noopener noreferrer" className={link}>
              Lancer la discussion
            </a>
          </p>
        </li>
        <li className="border-t-2 border-brand pt-5">
          <h2 className="font-display text-xl font-semibold">E-mail</h2>
          <p className="mt-2 leading-relaxed text-ink/70">
            Pour vos demandes formelles, techniques ou partenariats.
          </p>
          <p className="mt-4">
            <a
              href={`mailto:${site.email}?subject=${encodeURIComponent("Question depuis Examplay")}`}
              className={link}
            >
              Nous écrire
            </a>
          </p>
        </li>
        <li className="border-t-2 border-brand pt-5">
          <h2 className="font-display text-xl font-semibold">Suivez-nous</h2>
          <p className="mt-2 leading-relaxed text-ink/70">
            Rejoignez notre communauté sur les réseaux sociaux.
          </p>
          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
            {socials.map((s) => (
              <li key={s.label}>
                <a href={s.href} target="_blank" rel="noopener noreferrer" className={link}>
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </li>
      </ul>
    </PageShell>
  );
}
