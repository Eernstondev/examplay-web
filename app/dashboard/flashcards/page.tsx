import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Flashcards } from "@/components/app/flashcards";
import { SubHeader } from "@/components/app/ui";
import { getSubjects } from "@/lib/content";
import { getAccount } from "@/lib/data";

export const metadata: Metadata = { title: "Révision Smart" };

export default async function Page({ searchParams }: PageProps<"/dashboard/flashcards">) {
  const account = await getAccount();
  if (!account) redirect("/connexion");

  const params = await searchParams;
  const subject = getSubjects(account.level).find((s) => s.id === params.subject);
  if (!subject) redirect("/dashboard/matieres?mode=flash");

  return (
    <>
      <SubHeader title={`${subject.name} · Fiches`} back="/dashboard/matieres?mode=flash" />
      <Flashcards key={subject.id} subject={subject.id} />
    </>
  );
}
