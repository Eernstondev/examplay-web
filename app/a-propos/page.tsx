import type { Metadata } from "next";
import { Block, PageShell } from "@/components/page-shell";
import { getT } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "À propos",
  description: "Examplay, la plateforme éducative conçue et opérée par URBVEC Atelier.",
};

export default async function Page() {
  const t = await getT();
  return (
    <PageShell
      title={t("À propos d'Examplay")}
      lead={t("Examplay est une plateforme numérique éducative dédiée à la préparation aux examens officiels. Elle a été pensée pour répondre à une réalité simple : la réussite scolaire exige des outils fiables, structurés et alignés sur les programmes nationaux.")}
    >
      <Block title={t("Une méthode, pas des raccourcis")}>
        <p>
          {t("Examplay ne promet pas des raccourcis. Elle propose une méthode, un cadre, et une infrastructure technologique conçus pour accompagner les élèves avec sérieux et continuité.")}
        </p>
      </Block>

      <Block title={t("URBVEC Atelier")}>
        <p>
          {t("Examplay est conçue, développée et opérée par URBVEC Atelier, un atelier de création technologique indépendant, fondé avec une vision claire : mettre la technologie au service de l'éducation, avec rigueur, sécurité et responsabilité.")}
        </p>
        <p>
          {t("URBVEC Atelier est né d'une évolution naturelle : parti de la création visuelle et du design, l'atelier s'est structuré pour devenir un pôle complet d'ingénierie numérique, capable de porter des projets à fort impact éducatif et institutionnel.")}
        </p>
        <p>
          <a
            href="https://www.instagram.com/urbvec.atelier._"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("URBVEC Atelier sur Instagram")}
          </a>
        </p>
      </Block>

      <Block title={t("Un champ d'intervention complet")}>
        <p>
          {t("Dans le cadre d'Examplay, URBVEC Atelier déploie son expertise sur l'ensemble de la chaîne technologique :")}
        </p>
        <ul>
          <li>{t("Conception et développement d'applications web")}</li>
          <li>{t("Architecture et sécurisation de bases de données")}</li>
          <li>{t("Développement et intégration d'API évolutives")}</li>
          <li>{t("Systèmes de sécurité et contrôle d'accès")}</li>
          <li>{t("Outils d'administration et de gestion pédagogique")}</li>
          <li>{t("Veille technologique et éducative")}</li>
          <li>{t("Maintenance et optimisation continue")}</li>
        </ul>
        <p>
          <strong>{t("Vision :")}</strong>{t(" la stabilité aujourd'hui, la scalabilité demain.")}
        </p>
      </Block>

      <Block title={t("Une vision éducative responsable")}>
        <p>
          {t("Examplay s'inscrit dans une démarche de complémentarité avec le système éducatif. La plateforme ne remplace ni l'enseignant ni l'école : elle renforce, structure et prolonge l'apprentissage.")}
        </p>
        <p>
          {t("URBVEC Atelier adopte une approche respectueuse des programmes, des normes académiques et des réalités locales, tout en intégrant les standards technologiques internationaux.")}
        </p>
      </Block>

      <Block title={t("Gouvernance, éthique et sécurité")}>
        <p>{t("La plateforme repose sur des principes clairs :")}</p>
        <ul>
          <li>{t("Protection des données et respect de la vie privée")}</li>
          <li>{t("Sécurisation des accès et des contenus")}</li>
          <li>{t("Traçabilité, contrôle et transparence")}</li>
          <li>{t("Amélioration continue fondée sur l'analyse et la veille")}</li>
        </ul>
        <p>
          {t("Examplay est conçue comme une infrastructure éducative durable, capable d'évoluer avec les besoins des élèves et des institutions.")}
        </p>
      </Block>

      <Block title={t("Une ambition nationale, une portée évolutive")}>
        <p>
          {t("Examplay vise à devenir une référence éducative numérique, d'abord au niveau national, puis régional. URBVEC Atelier s'engage à bâtir une plateforme capable de s'adapter aux évolutions pédagogiques, technologiques et institutionnelles.")}
        </p>
      </Block>
    </PageShell>
  );
}
