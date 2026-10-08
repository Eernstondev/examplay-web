import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdSlot } from "@/components/ad-slot";
import { QuizPlayer, type QuizMode } from "@/components/app/quiz-player";
import { SubHeader } from "@/components/app/ui";
import { getSubjects } from "@/lib/content";
import { getAccount, getQuestionCounts, getResults } from "@/lib/data";
import { site } from "@/lib/site";
import { recommendSubject } from "@/lib/stats";

export const metadata: Metadata = { title: "Quiz" };

const MODES: QuizMode[] = ["quiz", "exam", "short", "essay"];
const SUFFIX: Record<QuizMode, string> = { quiz: "", exam: " · Simulation", short: " · Réponse courte", essay: " · Rédaction" };

export default async function Page({ searchParams }: PageProps<"/dashboard/quiz">) {
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

  return (
    <>
      <SubHeader title={subject.name + SUFFIX[mode]} back={backHref} />
      {chapter && <p className="-mt-3 mb-5 text-sm font-semibold text-ink/60">Chapitre : {chapter}</p>}
      <QuizPlayer
        key={`${subject.id}-${mode}-${chapter ?? ""}`}
        subject={subject.id}
        subjectName={subject.name}
        mode={mode}
        level={account.level}
        backHref={backHref}
        chapter={mode === "exam" ? undefined : chapter}
        beforeAd={<AdSlot placement="avant_quiz" target={target} className="mb-5" />}
        afterAd={<AdSlot placement="apres_quiz" target={target} className="mt-6" />}
        shareUrl={`${site.url}/commencer`}
        referralCode={account.referralCode}
      />
    </>
  );
}
