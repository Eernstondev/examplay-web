import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { getT } from "@/lib/i18n/server";

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

export default async function Page() {
  const t = await getT();
  return (
    <PageShell
      title={t("Gratitude et reconnaissance")}
      lead={t("Examplay est le fruit d'une intelligence collective. Nous exprimons notre profonde gratitude à ceux qui bâtissent, jour après jour, ce projet d'excellence éducative.")}
    >
      <ul className="grid gap-4 sm:grid-cols-2">
        {thanks.map((item) => (
          <li key={item.title} className="rounded-3xl bg-ink/[0.035] p-6 sm:p-7 sm:last:col-span-2">
            <h2 className="text-xl font-semibold">{t(item.title)}</h2>
            <p className="mt-2 max-w-xl leading-relaxed text-ink/70">{t(item.body)}</p>
          </li>
        ))}
      </ul>

      <figure className="mt-4 rounded-3xl bg-ink/[0.035] px-6 py-10 sm:px-12 sm:py-14">
        <blockquote className="max-w-3xl text-[clamp(1.25rem,3.5vw,1.625rem)] font-medium leading-snug tracking-tight">
          {t("« La réussite scolaire est une destination que l'on atteint ensemble. Merci d'être une part essentielle de ce voyage. »")}
        </blockquote>
        <figcaption className="mt-5 text-ink/60">{t("L'équipe URBVEC Atelier")}</figcaption>
      </figure>

      <p className="mt-10 text-ink/75">
        {t("Vous souhaitez contribuer ?")}{" "}
        <Link href="/contact" className="font-medium text-brand-fg underline underline-offset-4">
          {t("Rejoignez l'aventure")}
        </Link>
      </p>
    </PageShell>
  );
}
