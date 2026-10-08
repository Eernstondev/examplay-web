import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";
import { Block, PageShell } from "@/components/page-shell";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Investisseurs",
  description: "Investir dans Examplay, plateforme EdTech gratuite pour les élèves haïtiens.",
};

export default function Page() {
  return (
    <PageShell
      title="Investir dans l'avenir de l'éducation numérique"
      lead="Examplay est une startup EdTech engagée dans l'amélioration de la réussite scolaire à travers une plateforme gratuite, collaborative et rigoureusement structurée. Notre conviction est simple : l'accès à une éducation de qualité ne doit pas dépendre des moyens financiers des élèves."
    >
      <Block title="Le problème">
        <p>Dans de nombreux contextes éducatifs :</p>
        <ul>
          <li>Les élèves manquent de contenus fiables et adaptés aux examens</li>
          <li>Les ressources pédagogiques sont peu standardisées</li>
          <li>La préparation scolaire est inégale</li>
          <li>Les outils numériques existants sont peu engageants ou peu contrôlés</li>
        </ul>
        <p>
          <strong>Résultat :</strong> baisse de performance, découragement et inégalités
          persistantes.
        </p>
      </Block>

      <Block title="La solution Examplay">
        <p>Examplay propose :</p>
        <ul>
          <li>Une plateforme de quiz et contenus pédagogiques validés</li>
          <li>Une collaboration active avec enseignants et contributeurs certifiés</li>
          <li>Un système de labellisation garantissant la qualité académique</li>
          <li>Une expérience moderne, interactive et accessible gratuitement</li>
        </ul>
        <p>
          <strong>Les élèves ne paient pas. L&apos;impact est prioritaire.</strong>
        </p>
      </Block>

      <Block title="Le produit">
        <ul>
          <li>Quiz par matière et par niveau</li>
          <li>Corrections claires et expliquées</li>
          <li>Suivi de progression pédagogique</li>
          <li>Mise en avant des collaborateurs certifiés</li>
          <li>Contenus alignés avec les exigences académiques</li>
        </ul>
        <p>
          Examplay est pensé comme un outil de référence, utilisable aussi bien individuellement
          qu&apos;au sein des établissements scolaires.
        </p>
      </Block>

      <Block title="Marché et opportunité">
        <ul>
          <li>Forte croissance du numérique éducatif</li>
          <li>Millions d&apos;élèves en Haïti</li>
          <li>Besoin croissant d&apos;outils gratuits mais fiables</li>
          <li>Intérêt accru des institutions et partenaires éducatifs</li>
        </ul>
        <p>
          <strong>
            Examplay se positionne comme une plateforme d&apos;utilité publique éducative, scalable
            et durable.
          </strong>
        </p>
      </Block>

      <Block title="Avantage concurrentiel">
        <ul>
          <li>Accès gratuit pour les élèves</li>
          <li>Qualité contrôlée grâce au label Collaborateur Certifié Examplay</li>
          <li>Modèle collaboratif structuré</li>
          <li>Image institutionnelle et crédible</li>
          <li>Fort potentiel d&apos;adoption et de déploiement à grande échelle</li>
        </ul>
      </Block>

      <Block title="Modèle économique, sans premium">
        <p>La monétisation d&apos;Examplay repose sur des leviers indirects et durables :</p>
        <ul>
          <li>Partenariats institutionnels (écoles, universités, centres)</li>
          <li>Sponsoring éducatif (entreprises, fondations, ONG)</li>
          <li>Licences de contenus et services B2B</li>
          <li>Subventions et fonds d&apos;impact éducatif</li>
          <li>Investissements en nature (expertise, infrastructure, visibilité)</li>
        </ul>
        <p>
          <strong>
            Le modèle privilégie la stabilité et l&apos;impact, plutôt que le paiement individuel.
          </strong>
        </p>
      </Block>

      <Block title="Impact éducatif">
        <ul>
          <li>Amélioration mesurable des performances scolaires</li>
          <li>Réduction des inégalités d&apos;accès à la préparation</li>
          <li>Valorisation des talents éducatifs locaux</li>
          <li>Contribution à l&apos;innovation pédagogique régionale</li>
        </ul>
      </Block>

      <Block title="Opportunités d'investissement">
        <p>Nous recherchons des partenaires et investisseurs pour :</p>
        <ul>
          <li>Renforcer la plateforme technologique</li>
          <li>Structurer et élargir les contenus pédagogiques</li>
          <li>Déployer Examplay dans des établissements partenaires</li>
          <li>Amplifier l&apos;impact éducatif à grande échelle</li>
        </ul>
      </Block>

      <Block title="Vision long terme">
        <p>
          Examplay ambitionne de devenir une référence EdTech francophone à fort impact social, où
          la collaboration, la qualité et l&apos;accessibilité sont au cœur de l&apos;éducation
          numérique.
        </p>
      </Block>

      <section className="grid gap-6 border-t border-ink/10 pt-10 lg:grid-cols-[1fr_2fr] lg:gap-12">
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-tight">Contactez-nous</h2>
          <p className="mt-3 leading-relaxed text-ink/70">
            Notre équipe stratégique vous répondra sous 48 h. Ou par e-mail :{" "}
            <a href={`mailto:${site.email}`} className="text-brand-fg underline underline-offset-4">
              {site.email}
            </a>
          </p>
        </div>
        <div className="max-w-2xl">
          <ContactForm />
        </div>
      </section>
    </PageShell>
  );
}
