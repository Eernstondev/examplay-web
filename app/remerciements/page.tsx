import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = {
  title: "Remerciements",
  description: "Celles et ceux qui bâtissent Examplay, jour après jour.",
};

const thanks = [
  {
    title: "Experts pédagogiques",
    body: "À nos enseignants et spécialistes qui valident la rigueur de chaque question et assurent l'excellence académique de nos contenus.",
  },
  {
    title: "Partenaires institutionnels",
    body: "Aux écoles, lycées et universités qui nous font confiance pour accompagner leurs élèves vers la réussite aux examens officiels.",
  },
  {
    title: "Notre communauté",
    body: "À vous, les étudiants, dont la passion et les retours constructifs font vivre et évoluer cette plateforme collaborative chaque jour.",
  },
  {
    title: "Soutiens stratégiques",
    body: "Aux organisations et sponsors qui partagent notre mission sociale : rendre l'éducation de qualité accessible à tous, sans exception.",
  },
  {
    title: "L'équipe Examplay",
    body: "Aux développeurs, designers et stratèges d'URBVEC Atelier qui travaillent avec passion pour bâtir l'avenir de l'EdTech en Haïti.",
  },
];

export default function Page() {
  return (
    <PageShell
      title="Gratitude et reconnaissance"
      lead="Examplay est le fruit d'une intelligence collective. Nous exprimons notre profonde gratitude à ceux qui bâtissent, jour après jour, ce projet d'excellence éducative."
    >
      <ul className="grid gap-x-12 gap-y-10 sm:grid-cols-2">
        {thanks.map((item) => (
          <li key={item.title} className="border-t-2 border-brand pt-5">
            <h2 className="font-display text-xl font-semibold">{item.title}</h2>
            <p className="mt-2 max-w-md leading-relaxed text-ink/70">{item.body}</p>
          </li>
        ))}
      </ul>

      <figure className="mt-16 rounded-2xl bg-brand-soft px-6 py-10 sm:px-12 sm:py-14">
        <blockquote className="max-w-3xl font-display text-2xl font-semibold leading-snug sm:text-3xl">
          « La réussite scolaire est une destination que l&apos;on atteint ensemble. Merci
          d&apos;être une part essentielle de ce voyage. »
        </blockquote>
        <figcaption className="mt-5 text-ink/70">L&apos;équipe URBVEC Atelier</figcaption>
      </figure>

      <p className="mt-10 text-ink/75">
        Vous souhaitez contribuer ?{" "}
        <Link href="/contact" className="font-semibold text-brand underline underline-offset-4">
          Rejoignez l&apos;aventure
        </Link>
      </p>
    </PageShell>
  );
}
