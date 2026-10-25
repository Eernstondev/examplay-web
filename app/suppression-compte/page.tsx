import type { Metadata } from "next";
import Link from "next/link";
import { Block, PageShell } from "@/components/page-shell";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Supprimer son compte Examplay",
  description:
    "Comment demander la suppression de son compte Examplay et des données associées, et quelles données sont effacées ou conservées.",
  alternates: { canonical: "/suppression-compte" },
};

const subject = encodeURIComponent("Suppression de compte Examplay");

export default function Page() {
  return (
    <PageShell
      title="Supprimer son compte Examplay"
      lead="Examplay est une application éditée par URBVEC Atelier. Tu peux supprimer ton compte et tes données à tout moment, depuis l'application, depuis le site ou par e-mail."
    >
      <Block title="Depuis l'application">
        <ol className="list-decimal space-y-1.5 pl-5">
          <li>Ouvre l&apos;application Examplay et connecte-toi.</li>
          <li>Va dans <strong>Profil</strong>, puis <strong>Confidentialité</strong>.</li>
          <li>Touche <strong>Supprimer mon compte</strong>.</li>
          <li>Confirme deux fois. La suppression est immédiate et définitive.</li>
        </ol>
      </Block>

      <Block title="Depuis le site">
        <ol className="list-decimal space-y-1.5 pl-5">
          <li>
            Connecte-toi sur <Link href="/connexion">{site.url.replace("https://", "")}</Link>.
          </li>
          <li>Ouvre <strong>Mon profil</strong> (le rond avec ton initiale, en haut à droite).</li>
          <li>En bas de la page, choisis <strong>Supprimer mon compte</strong>.</li>
          <li>Écris SUPPRIMER pour confirmer.</li>
        </ol>
      </Block>

      <Block title="Sans accès à ton compte">
        <p>
          Écris-nous à{" "}
          <a href={`mailto:${site.email}?subject=${subject}`}>{site.email}</a> depuis l&apos;adresse
          e-mail de ton compte, avec pour objet « Suppression de compte Examplay ». Un parent ou
          tuteur peut faire la demande pour un élève mineur. Nous supprimons le compte sous 30 jours
          au plus et te confirmons la suppression par e-mail.
        </p>
      </Block>

      <Block title="Données supprimées">
        <ul>
          <li>Ton compte : nom, adresse e-mail, mot de passe, photo de profil, niveau, département et langue.</li>
          <li>Tes résultats de quiz et de simulations, ta progression, ton plan de révision et tes badges.</li>
          <li>Tes points et ta place dans les classements.</li>
          <li>Tes amis, demandes d&apos;amis et duels.</li>
          <li>Tes notifications, rappels et jetons de notification de ton téléphone.</li>
        </ul>
      </Block>

      <Block title="Données conservées">
        <ul>
          <li>
            Des statistiques anonymes (par exemple le nombre total de quiz passés sur une matière),
            qui ne permettent plus de t&apos;identifier.
          </li>
          <li>
            Les questions ou corrections que tu as proposées comme contributeur et qui ont été
            publiées restent dans l&apos;application, sans ton nom.
          </li>
          <li>
            Les copies de sauvegarde techniques de nos serveurs peuvent contenir tes données pendant
            30 jours au plus après la suppression, puis elles sont effacées.
          </li>
        </ul>
      </Block>

      <Block title="Questions">
        <p>
          Pour toute question, écris-nous à <a href={`mailto:${site.email}`}>{site.email}</a>. Voir
          aussi notre <Link href="/confidentialite">politique de confidentialité</Link>.
        </p>
      </Block>
    </PageShell>
  );
}
