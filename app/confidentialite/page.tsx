import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Politique de confidentialité" };

const collected = [
  [
    "Compte",
    "Nom, email, mot de passe (chiffré), niveau (ex. NS4-SVT, 9e), département",
    "Créer et identifier le compte, classer équitablement par niveau",
  ],
  [
    "Usage pédagogique",
    "Résultats de quiz et simulations, réponses données, séries de bonnes réponses (streak), progression par chapitre",
    "Suivre la progression, proposer des révisions ciblées",
  ],
  [
    "Compétition",
    "Résultats de duels, score, classement, demandes d'amis, code de parrainage",
    "Faire fonctionner les duels, le classement et le parrainage",
  ],
  [
    "Appareil",
    "Jeton de notification push, nom de l'appareil, date de dernière connexion",
    "Envoyer des rappels de révision, sécuriser le compte (appareils connus)",
  ],
  [
    "Personnalisation",
    "Avatar choisi, préférences d'affichage et de son",
    "Personnaliser l'expérience",
  ],
];

const providers = [
  [
    "Supabase",
    "Hébergement de la base de données et authentification",
    "Toutes les données de compte et d'usage",
  ],
  [
    "Expo / EAS",
    "Mises à jour de l'application et envoi des notifications push",
    "Jeton de notification, version de l'application",
  ],
];

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h} scope="col">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[0]}>
              {row.map((cell, i) =>
                i === 0 ? (
                  <th key={cell} scope="row">
                    {cell}
                  </th>
                ) : (
                  <td key={cell}>{cell}</td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Page() {
  return (
    <LegalPage title="Politique de confidentialité">
      <p className="updated">Dernière mise à jour : 1er octobre 2026</p>
      <p>
        Examplay est une application de préparation aux examens d&apos;État (NS4 et 9e année
        fondamentale) destinée aux élèves haïtiens, éditée depuis Haïti.
      </p>
      <p>
        Cette politique de confidentialité explique quelles données Examplay collecte, pourquoi, et
        comment les élèves ou leurs parents peuvent les contrôler. Elle s&apos;applique à
        l&apos;application mobile Examplay (Android et iOS) et à tout site associé.
      </p>
      <p>
        En créant un compte, l&apos;utilisateur (ou le parent/tuteur d&apos;un élève mineur) accepte
        cette politique et les <a href="/conditions">conditions générales d&apos;utilisation</a>.
      </p>

      <h2>Données que nous collectons</h2>
      <p>
        Examplay collecte uniquement ce qui est nécessaire au fonctionnement du compte et du
        classement.
      </p>
      <Table head={["Catégorie", "Données", "Pourquoi"]} rows={collected} />
      <p>
        Examplay ne demande jamais de date de naissance exacte, de numéro d&apos;identification
        national, ni d&apos;information financière : il n&apos;y a aujourd&apos;hui aucun paiement
        dans l&apos;application.
      </p>
      <p>
        L&apos;authentification par Face ID ou empreinte digitale, quand elle est activée, reste
        strictement locale à l&apos;appareil : aucune donnée biométrique n&apos;est envoyée à
        Examplay ou à ses serveurs.
      </p>

      <h2>Utilisation des données</h2>
      <p>Les données servent exclusivement à faire fonctionner Examplay :</p>
      <ul>
        <li>faire fonctionner le compte, la connexion et la récupération de mot de passe ;</li>
        <li>afficher la progression personnelle et les statistiques par matière ;</li>
        <li>organiser les duels et le classement entre élèves d&apos;un même niveau ;</li>
        <li>
          envoyer des notifications de rappel de révision et des alertes liées au compte à rebours
          des examens ;
        </li>
        <li>
          détecter les usages anormaux (triche, comptes multiples) pour garder un classement juste ;
        </li>
        <li>
          améliorer le contenu pédagogique (quelles matières et chapitres sont les plus difficiles).
        </li>
      </ul>
      <p>
        Examplay n&apos;utilise jamais les données pour de la publicité ciblée et ne vend aucune
        donnée personnelle à un tiers.
      </p>

      <h2>Partage avec des tiers</h2>
      <p>
        Examplay ne vend ni ne loue aucune donnée personnelle. Certaines données passent par des
        prestataires techniques, uniquement pour faire fonctionner l&apos;application :
      </p>
      <Table head={["Prestataire", "Rôle", "Données concernées"]} rows={providers} />
      <p>
        Ces prestataires n&apos;ont pas le droit d&apos;utiliser ces données pour leur propre compte ;
        ils les traitent uniquement pour le compte d&apos;Examplay.
      </p>
      <p>
        Examplay peut communiquer des données si la loi l&apos;exige, par exemple sur demande
        d&apos;une autorité compétente en Haïti.
      </p>

      <h2>Mineurs et protection des élèves</h2>
      <p>
        La majorité des utilisateurs d&apos;Examplay sont des élèves mineurs, en particulier en 9e
        année fondamentale. Examplay en tient compte :
      </p>
      <ul>
        <li>aucune date de naissance exacte n&apos;est demandée à l&apos;inscription ;</li>
        <li>
          aucun contenu publicitaire, ciblé ou non, n&apos;est affiché dans l&apos;application ;
        </li>
        <li>
          les échanges entre élèves se limitent aux duels et demandes d&apos;amis liés à la révision
          scolaire ; il n&apos;y a pas de messagerie libre ;
        </li>
        <li>
          nous recommandons qu&apos;un parent ou tuteur supervise la création du compte d&apos;un
          élève de 9e année, et accepte cette politique en son nom.
        </li>
      </ul>
      <p>
        Si un parent ou tuteur pense que son enfant a fourni des données personnelles sans son
        accord, il peut demander leur suppression à tout moment (voir « Droits de
        l&apos;utilisateur » ci-dessous).
      </p>

      <h2>Droits de l&apos;utilisateur</h2>
      <p>Chaque utilisateur peut, à tout moment :</p>
      <ul>
        <li>consulter les informations de son compte, dans Profil ;</li>
        <li>corriger son nom ou son email, dans Profil &gt; Sécurité ;</li>
        <li>
          supprimer définitivement son compte et ses données, dans Profil &gt; Confidentialité &gt;
          Supprimer mon compte ;
        </li>
        <li>demander une copie de ses données en nous écrivant (voir Contact).</li>
      </ul>
      <p>
        La suppression du compte efface les données personnelles (nom, email, résultats, duels) des
        serveurs d&apos;Examplay. Le niveau et le département ne peuvent pas être modifiés après
        l&apos;inscription, afin de garantir un classement juste entre élèves ; en cas d&apos;erreur
        à l&apos;inscription, contacter le support.
      </p>

      <h2>Sécurité et conservation des données</h2>
      <p>
        Les données circulent chiffrées entre l&apos;application et nos serveurs. Chaque compte
        n&apos;a accès qu&apos;à ses propres données : un élève ne peut ni lire ni modifier les
        données d&apos;un autre élève, grâce à des règles de sécurité appliquées directement sur la
        base de données (RLS Supabase).
      </p>
      <p>
        Les données sont conservées tant que le compte existe. Lors de la suppression du compte, les
        données personnelles sont effacées des serveurs ; des données statistiques anonymisées (par
        exemple le nombre total de quiz passés sur une matière) peuvent être conservées sans lien
        avec l&apos;identité de l&apos;élève.
      </p>

      <h2>Modifications de cette politique</h2>
      <p>
        Cette politique peut évoluer, par exemple si Examplay ajoute une fonctionnalité qui change
        les données collectées. Tout changement important sera annoncé dans l&apos;application avant
        son entrée en vigueur. La date de dernière mise à jour figure en haut de ce document.
      </p>

      <h2>Contact</h2>
      <p>
        Pour toute question sur cette politique ou pour exercer un droit sur ses données :{" "}
        <a href={`mailto:${site.email}`}>{site.email}</a>.
      </p>
    </LegalPage>
  );
}
