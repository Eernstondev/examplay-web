import type { Metadata } from "next";
import Link from "next/link";
import { Block, PageShell } from "@/components/page-shell";
import { PUBLIC_SUBJECTS, type PublicSubject } from "@/lib/content";
import { getT } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "Matières des examens d'État",
  description:
    "Toutes les matières de la 9e année fondamentale et du NS4 : chapitres du programme et questions corrigées pour réviser les examens d'État haïtiens.",
  alternates: { canonical: "/matieres" },
};

function SubjectList({ subjects }: { subjects: PublicSubject[] }) {
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {subjects.map((s) => (
        <li key={s.slug}>
          <Link
            href={`/matieres/${s.slug}`}
            className="flex min-h-14 items-center justify-between gap-3 rounded-2xl bg-surface px-4 py-3 font-semibold ring-1 ring-ink/10 transition-shadow hover:ring-2 hover:ring-brand"
          >
            <span>{s.name}</span>
            {s.series.length > 0 && (
              <span className="shrink-0 text-xs font-medium text-ink/55">{s.series.join(" · ")}</span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default async function Page() {
  const t = await getT();
  return (
    <PageShell
      title={t("Matières des examens d'État")}
      lead={t("Choisis une matière pour voir ses chapitres et quelques questions corrigées. Tout le reste t'attend dans l'app, gratuitement.")}
    >
      <Block plain title={t("9e année fondamentale")}>
        <SubjectList subjects={PUBLIC_SUBJECTS.filter((s) => s.group === "9e")} />
      </Block>
      <Block plain title={t("NS4 (bac haïtien)")}>
        <SubjectList subjects={PUBLIC_SUBJECTS.filter((s) => s.group === "ns4")} />
      </Block>
    </PageShell>
  );
}
