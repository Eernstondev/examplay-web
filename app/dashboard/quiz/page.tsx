import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdSlot } from "@/components/ad-slot";
import { QuizPlayer, type QuizMode } from "@/components/app/quiz-player";
import { SubHeader } from "@/components/app/ui";
import { getSubjects } from "@/lib/content";
import { getAccount, getAnnales, getQuestionCounts, getResults } from "@/lib/data";
import { annaleKey, parseAnnale } from "@/lib/annales";
import { site } from "@/lib/site";
import { recommendSubject } from "@/lib/stats";
import { getT } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Quiz" };

const MODES: QuizMode[] = ["quiz", "exam", "short", "essay"];
const SUFFIX: Record<QuizMode, string> = { quiz: "", exam: " · Simulation", short: " · Réponse courte", essay: " · Rédaction" };

export default async function Page({ searchParams }: PageProps<"/dashboard/quiz">) {
  const t = await getT();
  const account = await getAccount();
  if (!account) redirect("/connexion");

  const params = await searchParams;
  const mode = MODES.find((m) => m === params.mode) ?? "quiz";
  const subjects = getSubjects(account.level);
  // Quiz rapide lancé depuis le tableau de bord : pas de matière, on prend la recommandée.
  const recommended = params.subject === undefined && mode === "quiz";
  const subject = recommended
    ? recommendSubject(subjects, ...(await Promise.all([getResults(), getQuestionCounts()])))
    : subjects.find((s) => s.id === params.subject);
  if (!subject) redirect(`/dashboard/matieres?mode=${mode}`);
  const target = { department: account.department, level: account.level };
  const chapter = typeof params.chapter === "string" && params.chapter ? params.chapter : undefined;
  // La simulation porte sur toute la matière : pas d'étape « chapitre ».
  const backHref = recommended
    ? "/dashboard"
    : mode === "exam"
      ? "/dashboard/matieres?mode=exam"
      : `/dashboard/chapitres?subject=${subject.id}&mode=${mode}`;

  // Simulation : choix entre l'épreuve générale et les annales de la matière.
  const annale = mode === "exam" ? parseAnnale(params.annale) : null;
  const annales = mode === "exam" && !annale && params.annale !== "general" ? await getAnnales(subject.id) : [];
  if (annales.length) {
    const examHref = (key: string) => `/dashboard/quiz?${new URLSearchParams({ subject: subject.id, mode, annale: key })}`;
    const row =
      "flex items-center justify-between gap-3 rounded-2xl p-4 transition-transform active:scale-[0.98]";
    return (
      <>
        <SubHeader title={subject.name + t(SUFFIX[mode])} back={backHref} />
        <ul className="grid gap-2.5 md:grid-cols-2">
          <li className="md:col-span-2">
            <Link href={examHref("general")} className={`${row} bg-brand text-white`}>
              <span>
                <span className="block font-display text-lg font-semibold">{t("Simulation générale")}</span>
                <span className="text-sm text-white/80">{t("Toutes les questions à choix multiples de la matière.")}</span>
              </span>
            </Link>
          </li>
          {annales.map((a) => (
            <li key={annaleKey(a)}>
              <Link href={examHref(annaleKey(a))} className={`${row} bg-surface ring-1 ring-ink/10 hover:ring-2 hover:ring-brand`}>
                <span>
                  <span className="block font-semibold leading-snug">{a.session}</span>
                  <span className="text-sm text-ink/60">{t("Annale {year}", { year: a.year })}</span>
                </span>
                <span className="shrink-0 text-sm text-ink/60">{a.count}{t(" questions")}</span>
              </Link>
            </li>
          ))}
        </ul>
      </>
    );
  }
  const examBack = mode === "exam" && params.annale ? `/dashboard/quiz?subject=${subject.id}&mode=exam` : backHref;

  return (
    <>
      <SubHeader title={subject.name + t(SUFFIX[mode])} back={examBack} />
      {annale && <p className="-mt-3 mb-5 text-sm font-semibold text-ink/60">{annale.session}</p>}
      {chapter && <p className="-mt-3 mb-5 text-sm font-semibold text-ink/60">{t("Chapitre : ")}{chapter}</p>}
      <QuizPlayer
        key={`${subject.id}-${mode}-${chapter ?? ""}-${annale ? annaleKey(annale) : ""}`}
        subject={subject.id}
        subjectName={subject.name}
        mode={mode}
        level={account.level}
        backHref={examBack}
        chapter={mode === "exam" ? undefined : chapter}
        annale={annale ?? undefined}
        beforeAd={<AdSlot placement="avant_quiz" target={target} className="mb-5" />}
        afterAd={<AdSlot placement="apres_quiz" target={target} className="mt-6" />}
        shareUrl={`${site.url}/commencer`}
        referralCode={account.referralCode}
      />
    </>
  );
}
