import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SubHeader } from "@/components/app/ui";
import { getSubjects } from "@/lib/content";
import { getAccount } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Cours" };

export default async function Page({ params }: PageProps<"/dashboard/cours/[subject]">) {
  const account = await getAccount();
  if (!account) redirect("/connexion");

  const { subject: subjectId } = await params;
  const subject = getSubjects(account.level).find((s) => s.id === subjectId);
  if (!subject) notFound();

  const supabase = await createClient();
  const { data } = await supabase
    .from("courses")
    .select("id, chapter, title, created_at")
    .eq("subject_id", subject.id)
    .order("chapter", { ascending: true, nullsFirst: true })
    .order("created_at", { ascending: false });
  const courses = data ?? [];

  return (
    <>
      <SubHeader title={subject.name} back="/dashboard/cours" />
      {courses.length === 0 ? (
        <p className="py-10 text-center text-ink/70">Aucun cours publié dans cette matière pour le moment.</p>
      ) : (
        <ul className="mt-5 grid gap-2.5 md:grid-cols-2">
          {courses.map((c) => (
            <li key={c.id}>
              <Link
                href={`/dashboard/cours/${subject.id}/${c.id}`}
                className="block rounded-2xl bg-white p-4 ring-1 ring-ink/10 transition-transform hover:ring-2 hover:ring-brand active:scale-[0.98]"
              >
                {c.chapter && <p className="text-xs font-semibold uppercase tracking-wide text-brand">{c.chapter}</p>}
                <p className="mt-0.5 font-display text-lg font-semibold leading-snug">{c.title}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
