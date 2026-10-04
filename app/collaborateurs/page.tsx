import type { Metadata } from "next";
import Link from "next/link";
import { Block, PageShell } from "@/components/page-shell";
import { partners } from "@/lib/partners";

export const metadata: Metadata = {
  title: "Collaborateurs",
  description: "Les partenaires, experts et institutions qui accompagnent Examplay.",
};

export default function Page() {
  return (
    <PageShell
      title="L'écosystème Examplay"
      lead="Examplay grandit grâce à la confiance de ses partenaires. Découvrez les entités et les personnes qui rendent cette aventure possible."
    >
      {partners.map((group) => (
        <Block key={group.title} title={group.title}>
          {group.items.length === 0 ? (
            <p>
              Aucun nom annoncé pour le moment.{" "}
              <Link href="/contact">Contactez-nous pour rejoindre Examplay</Link>.
            </p>
          ) : (
            <ul>
              {group.items.map((p) => (
                <li key={p.name}>
                  {p.url ? (
                    <a href={p.url} target="_blank" rel="noopener noreferrer">
                      {p.name}
                    </a>
                  ) : (
                    <strong>{p.name}</strong>
                  )}
                  {p.role && `, ${p.role}`}
                </li>
              ))}
            </ul>
          )}
        </Block>
      ))}
    </PageShell>
  );
}
