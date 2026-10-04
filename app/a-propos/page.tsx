import type { Metadata } from "next";
import { Block, PageShell } from "@/components/page-shell";

export const metadata: Metadata = {
  title: "À propos",
  description: "Examplay, la plateforme éducative conçue et opérée par URBVEC Atelier.",
};

export default function Page() {
  return (
    <PageShell
      title="À propos d'Examplay"
      lead="Examplay est une plateforme numérique éducative dédiée à la préparation aux examens officiels. Elle a été pensée pour répondre à une réalité simple : la réussite scolaire exige des outils fiables, structurés et alignés sur les programmes nationaux."
    >
      <Block title="Une méthode, pas des raccourcis">
        <p>
          Examplay ne promet pas des raccourcis. Elle propose une méthode, un cadre, et une
          infrastructure technologique conçus pour accompagner les élèves avec sérieux et
          continuité.
        </p>
      </Block>

      <Block title="URBVEC Atelier">
        <p>
          Examplay est conçue, développée et opérée par URBVEC Atelier, un atelier de création
          technologique indépendant, fondé avec une vision claire : mettre la technologie au
          service de l&apos;éducation, avec rigueur, sécurité et responsabilité.
        </p>
        <p>
          URBVEC Atelier est né d&apos;une évolution naturelle : parti de la création visuelle et du
          design, l&apos;atelier s&apos;est structuré pour devenir un pôle complet d&apos;ingénierie
          numérique, capable de porter des projets à fort impact éducatif et institutionnel.
        </p>
        <p>
          <a
            href="https://www.instagram.com/urbvec.atelier._"
            target="_blank"
            rel="noopener noreferrer"
          >
            URBVEC Atelier sur Instagram
          </a>
        </p>
      </Block>

      <Block title="Un champ d'intervention complet">
        <p>
          Dans le cadre d&apos;Examplay, URBVEC Atelier déploie son expertise sur l&apos;ensemble de
          la chaîne technologique :
        </p>
        <ul>
          <li>Conception et développement d&apos;applications web</li>
          <li>Architecture et sécurisation de bases de données</li>
          <li>Développement et intégration d&apos;API évolutives</li>
          <li>Systèmes de sécurité et contrôle d&apos;accès</li>
          <li>Outils d&apos;administration et de gestion pédagogique</li>
          <li>Veille technologique et éducative</li>
          <li>Maintenance et optimisation continue</li>
        </ul>
        <p>
          <strong>Vision :</strong> la stabilité aujourd&apos;hui, la scalabilité demain.
        </p>
      </Block>

      <Block title="Une vision éducative responsable">
        <p>
          Examplay s&apos;inscrit dans une démarche de complémentarité avec le système éducatif. La
          plateforme ne remplace ni l&apos;enseignant ni l&apos;école : elle renforce, structure et
          prolonge l&apos;apprentissage.
        </p>
        <p>
          URBVEC Atelier adopte une approche respectueuse des programmes, des normes académiques et
          des réalités locales, tout en intégrant les standards technologiques internationaux.
        </p>
      </Block>

      <Block title="Gouvernance, éthique et sécurité">
        <p>La plateforme repose sur des principes clairs :</p>
        <ul>
          <li>Protection des données et respect de la vie privée</li>
          <li>Sécurisation des accès et des contenus</li>
          <li>Traçabilité, contrôle et transparence</li>
          <li>Amélioration continue fondée sur l&apos;analyse et la veille</li>
        </ul>
        <p>
          Examplay est conçue comme une infrastructure éducative durable, capable d&apos;évoluer
          avec les besoins des élèves et des institutions.
        </p>
      </Block>

      <Block title="Une ambition nationale, une portée évolutive">
        <p>
          Examplay vise à devenir une référence éducative numérique, d&apos;abord au niveau
          national, puis régional. URBVEC Atelier s&apos;engage à bâtir une plateforme capable de
          s&apos;adapter aux évolutions pédagogiques, technologiques et institutionnelles.
        </p>
      </Block>
    </PageShell>
  );
}
