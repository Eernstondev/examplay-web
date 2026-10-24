import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { site, socials } from "@/lib/site";
import { getT } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "Nous contacter",
  description: "Joindre l'équipe Examplay par WhatsApp, e-mail ou sur les réseaux sociaux.",
};

const link = "inline-block py-1.5 font-medium text-brand-fg underline underline-offset-4";

export default async function Page() {
  const t = await getT();
  return (
    <PageShell
      title={t("Restons en contact")}
      lead={t("Une question, une suggestion ou besoin d'assistance ? Notre équipe est à votre écoute pour faire progresser l'éducation ensemble.")}
    >
      <ul className="grid gap-4 md:grid-cols-3">
        <li className="flex flex-col rounded-3xl bg-ink/[0.035] p-6 sm:p-7">
          <h2 className="text-xl font-semibold">{t("WhatsApp")}</h2>
          <p className="mt-2 leading-relaxed text-ink/70">
            {t("Le moyen le plus rapide pour nous joindre directement.")}
          </p>
          <p className="mt-auto pt-5">
            <a href={site.whatsapp} target="_blank" rel="noopener noreferrer" className={link}>
              {t("Lancer la discussion")}
            </a>
          </p>
        </li>
        <li className="flex flex-col rounded-3xl bg-ink/[0.035] p-6 sm:p-7">
          <h2 className="text-xl font-semibold">{t("E-mail")}</h2>
          <p className="mt-2 leading-relaxed text-ink/70">
            {t("Pour vos demandes formelles, techniques ou partenariats.")}
          </p>
          <p className="mt-auto pt-5">
            <a
              href={`mailto:${site.email}?subject=${encodeURIComponent("Question depuis Examplay")}`}
              className={link}
            >
              {t("Nous écrire")}
            </a>
          </p>
        </li>
        <li className="flex flex-col rounded-3xl bg-ink/[0.035] p-6 sm:p-7">
          <h2 className="text-xl font-semibold">{t("Suivez-nous")}</h2>
          <p className="mt-2 leading-relaxed text-ink/70">
            {t("Rejoignez notre communauté sur les réseaux sociaux.")}
          </p>
          <ul className="mt-auto flex flex-wrap gap-x-5 gap-y-2 pt-5">
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
