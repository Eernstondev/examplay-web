import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Conditions générales d'utilisation" };

export default function Page() {
  return (
    <LegalPage title="Conditions générales d'utilisation">
      <p className="updated">Dernière mise à jour : 5 octobre 2026</p>

      <h2>Objet</h2>
      <p>
        Examplay est un outil d&apos;entraînement aux examens d&apos;État haïtiens (NS4 : SVT, SMP,
        SES, LLA ; 9e année fondamentale). Il propose des quiz, simulations, duels entre élèves et un
        suivi de progression.
      </p>
      <p>
        En créant un compte, l&apos;utilisateur accepte les présentes conditions ainsi que la{" "}
        <a href="/confidentialite">politique de confidentialité</a>. Pour un élève mineur, un parent
        ou tuteur est réputé avoir donné son accord.
      </p>

      <h2>Compte utilisateur</h2>
      <p>
        L&apos;utilisateur s&apos;engage à fournir des informations exactes à l&apos;inscription,
        notamment son niveau et son département, fixés définitivement afin de garantir un classement
        juste entre élèves du même niveau.
      </p>
      <p>
        L&apos;utilisateur est responsable de la confidentialité de son mot de passe et de toute
        activité sur son compte. En cas de doute sur un accès non autorisé, il doit changer son mot
        de passe immédiatement et contacter le support.
      </p>
      <p>Un seul compte par élève est autorisé.</p>

      <h2>Règles d&apos;usage</h2>
      <p>L&apos;utilisateur s&apos;engage à :</p>
      <ul>
        <li>
          ne pas tricher dans les quiz, simulations ou duels (les scores sont vérifiés
          automatiquement par nos serveurs) ;
        </li>
        <li>ne pas créer plusieurs comptes pour fausser un classement ;</li>
        <li>
          adopter un comportement respectueux envers les autres élèves, notamment dans les duels et
          demandes d&apos;amis ;
        </li>
        <li>
          ne pas tenter de perturber le fonctionnement de l&apos;application ou d&apos;accéder aux
          données d&apos;un autre compte.
        </li>
      </ul>
      <p>
        Tout manquement grave ou répété peut entraîner la suspension ou la suppression du compte
        (voir « Suspension et résiliation »).
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        Les questions, corrigés, explications et l&apos;ensemble du contenu pédagogique
        d&apos;Examplay sont fournis pour un usage personnel et non commercial, dans le cadre de la
        préparation aux examens.
      </p>
      <p>
        Il est interdit de copier, redistribuer ou revendre le contenu d&apos;Examplay sans
        autorisation écrite préalable. Le nom et le logo Examplay ne peuvent pas être utilisés sans
        accord.
      </p>

      <h2>Signalements et contributions</h2>
      <p>
        Le signalement d&apos;une question sert à améliorer le contenu : il doit être sincère. Les
        signalements abusifs ou répétés sans raison peuvent entraîner la suspension du compte.
      </p>
      <p>
        Les enseignants et experts autorisés peuvent proposer des questions, des corrections et des
        cours. En proposant un contenu, le contributeur garantit qu&apos;il en est l&apos;auteur ou
        qu&apos;il a le droit de le partager, et autorise Examplay à le relire, le modifier et le
        publier gratuitement sur le site et dans l&apos;application. Examplay reste libre
        d&apos;accepter, de modifier ou de refuser toute proposition.
      </p>

      <h2>Limitation de responsabilité</h2>
      <p>
        Examplay est un outil d&apos;entraînement : il ne garantit pas la réussite aux examens
        officiels. Le contenu est fourni « en l&apos;état », avec le soin apporté à son exactitude,
        mais sans garantie absolue contre les erreurs.
      </p>
      <p>
        Examplay ne peut être tenu responsable d&apos;une interruption de service due à une coupure
        réseau, une panne de serveur, ou un cas de force majeure. L&apos;application peut être
        indisponible temporairement pour maintenance.
      </p>

      <h2>Suspension et résiliation</h2>
      <p>
        Examplay peut suspendre ou supprimer un compte en cas de triche avérée, de création de
        comptes multiples, de comportement abusif envers d&apos;autres élèves, ou de non-respect de
        ces conditions. L&apos;utilisateur peut à tout moment supprimer son propre compte (Profil
        &gt; Confidentialité).
      </p>
      <p>
        Ces conditions sont régies par le droit haïtien. Tout litige sera soumis aux tribunaux
        compétents d&apos;Haïti, sauf disposition légale contraire.
      </p>

      <h2>Contact</h2>
      <p>
        Pour toute question sur ces conditions : <a href={`mailto:${site.email}`}>{site.email}</a>.
      </p>
    </LegalPage>
  );
}
