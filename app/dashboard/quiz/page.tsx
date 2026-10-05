import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { QuizPlayer, type QuizMode } from "@/components/app/quiz-player";
import { SubHeader } from "@/components/app/ui";
import { getSubjects } from "@/lib/content";
import { getAccount } from "@/lib/data";

export const metadata: Metadata = { title: "Quiz" };

const MODES: QuizMode[] = ["quiz", "exam", "short", "essay"];
const SUFFIX: Record<QuizMode, string> = { quiz: "", exam: " · Simulation", short: " · Réponse courte", essay: " · Rédaction" };

export default async function Page({ searchParams }: PageProps<"/dashboard/quiz">) {
  const account = await getAccount();
  if (!account) redirect("/connexion");

  const params = await searchParams;
  const mode = MODES.find((m) => m === params.mode) ?? "quiz";
  const subject = getSubjects(account.level).find((s) => s.id === params.subject);
  const backHref = `/dashboard/matieres?mode=${mode}`;
  if (!subject) redirect(backHref);

  return (
    <>
      <SubHeader title={subject.name + SUFFIX[mode]} back={backHref} />
      <QuizPlayer
        key={`${subject.id}-${mode}`}
        subject={subject.id}
        subjectName={subject.name}
        mode={mode}
        level={account.level}
        backHref={backHref}
      />
    </>
  );
}
