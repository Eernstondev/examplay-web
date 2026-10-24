import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Block, PageShell } from "@/components/page-shell";
import { PUBLIC_SUBJECTS, type PublicSubject } from "@/lib/content";
import { getSubjectPreview } from "@/lib/public-subjects";
import { getT } from "@/lib/i18n/server";
import { site } from "@/lib/site";

const letters = ["A", "B", "C", "D", "E", "F"];
const find = (slug: string) => PUBLIC_SUBJECTS.find((s) => s.slug === slug);
const examLabel = (s: PublicSubject) => (s.group === "9e" ? "9e AF" : "NS4");

export async function generateMetadata({ params }: PageProps<"/matieres/[slug]">): Promise<Metadata> {
  const subject = find((await params).slug);
  if (!subject) return {};
  const exam = examLabel(subject);
  return {
    title: `${subject.name} ${exam} : chapitres et questions corrigées`,
    description: `Révise ${subject.name} pour l'examen d'État ${exam} : chapitres du programme, questions corrigées avec explications et simulations d'examen. Gratuit sur ${site.name}.`,
    alternates: { canonical: `/matieres/${subject.slug}` },
  };
}

export default async function Page({ params }: PageProps<"/matieres/[slug]">) {
  const subject = find((await params).slug);
  if (!subject) notFound();
  const t = await getT();
  const { chapters, samples } = await getSubjectPreview(subject.id);
  const exam = examLabel(subject);
  const total = chapters.reduce((n, c) => n + c.questions, 0);
  const others = PUBLIC_SUBJECTS.filter((s) => s.group === subject.group && s.slug !== subject.slug);

  // Données structurées « Quiz » : les questions corrigées affichées sur la page.
  const jsonLd = samples.length
    ? JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Quiz",
        name: `${subject.name} ${exam}`,
        about: { "@type": "Thing", name: subject.name },
        educationalLevel: exam,
        inLanguage: "fr",
        hasPart: samples.map((q) => ({
          "@type": "Question",
          eduQuestionType: "Multiple choice",
          text: q.question,
          acceptedAnswer: { "@type": "Answer", text: q.choices[q.answer], answerExplanation: { "@type": "Comment", text: q.explain } },
          suggestedAnswer: q.choices
            .filter((_, i) => i !== q.answer)
            .map((text) => ({ "@type": "Answer", text })),
        })),
      }).replace(/</g, "\\u003c")
    : null;

  return (
    <PageShell
      title={`${subject.name}, ${exam}`}
      lead={t("Les chapitres du programme et quelques questions corrigées pour réviser {name} avant l'examen d'État.", {
        name: subject.name,
      })}
    >
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />}

      <nav aria-label={t("Fil d'Ariane")} className="-mt-4 mb-8 text-sm text-ink/60 sm:-mt-6">
        <Link href="/matieres" className="underline underline-offset-4 hover:text-brand-fg">
          {t("Matières")}
        </Link>
        <span aria-hidden="true"> / </span>
        <span>{subject.group === "9e" ? t("9e année fondamentale") : t("NS4 (bac haïtien)")}</span>
      </nav>

      <Block plain title={t("Chapitres")}>
        {chapters.length ? (
          <>
            <p className="mb-4 text-ink/70">{t("{count} questions dans l'app pour cette matière.", { count: total })}</p>
            <ul className="divide-y divide-ink/10 border-y border-ink/10">
              {chapters.map((c) => (
                <li key={c.title} className="flex items-baseline justify-between gap-4 py-3">
                  <span className="font-medium">{c.title}</span>
                  <span className="shrink-0 text-sm text-ink/55">{c.questions}</span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-ink/70">{t("Les questions de cette matière arrivent bientôt.")}</p>
        )}
      </Block>

      {samples.length > 0 && (
        <Block plain title={t("Questions corrigées")}>
          <ol className="grid gap-8">
            {samples.map((q, n) => (
              <li key={n}>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">
                  {t("Question {n}", { n: n + 1 })}
                  {q.chapter ? ` · ${q.chapter}` : ""}
                  {q.year ? ` · ${t("Examen {year}", { year: q.year })}` : ""}
                </p>
                <p className="mt-1.5 font-semibold leading-snug">{q.question}</p>
                <ul className="mt-3 grid gap-1.5">
                  {q.choices.map((choice, i) => (
                    <li
                      key={i}
                      className={`flex gap-2.5 rounded-xl px-3 py-2 ${
                        i === q.answer ? "bg-success-soft font-semibold text-success-fg" : "text-ink/75"
                      }`}
                    >
                      <span className="w-4 shrink-0 font-semibold">{letters[i]}</span>
                      <span>{choice}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 leading-relaxed text-ink/75">
                  <strong className="text-ink">{t("Explication :")}</strong> {q.explain}
                </p>
              </li>
            ))}
          </ol>
        </Block>
      )}

      <Block plain title={t("Continuer dans l'app")}>
        <p className="leading-relaxed text-ink/75">
          {t("Quiz par chapitre, simulations d'examen chronométrées et suivi de tes points faibles. Gratuit, sur téléphone et sur le web.")}
        </p>
        <Link
          href="/commencer"
          className="mt-5 inline-flex h-12 items-center justify-center rounded-full bg-brand px-7 font-medium text-white transition-colors hover:bg-brand-dark"
        >
          {t("Commencer")}
        </Link>
      </Block>

      <Block plain title={t("Autres matières")}>
        <ul className="flex flex-wrap gap-2">
          {others.map((s) => (
            <li key={s.slug}>
              <Link
                href={`/matieres/${s.slug}`}
                className="inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium ring-1 ring-ink/15 hover:ring-brand"
              >
                {s.name}
              </Link>
            </li>
          ))}
        </ul>
      </Block>
    </PageShell>
  );
}
