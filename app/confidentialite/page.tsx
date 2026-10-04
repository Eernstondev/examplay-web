import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Politique de confidentialité" };

export default function Page() {
  return (
    <LegalPage title="Politique de confidentialité">
      {/* TODO : coller ici le contenu de la page HTML déjà publiée (h2, p, ul). */}
      <p>
        Cette page est en cours de mise en ligne. Pour toute question, écris à{" "}
        <a href={`mailto:${site.email}`}>{site.email}</a>.
      </p>
    </LegalPage>
  );
}
