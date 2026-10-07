import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { SubHeader } from "@/components/app/ui";
import { getSubjects } from "@/lib/content";
import { getAccount } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({ params }: PageProps<"/dashboard/cours/[subject]/[id]">): Promise<Metadata> {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { title: "Cours" };
  const supabase = await createClient();
  const { data } = await supabase.from("courses").select("title").eq("id", id).maybeSingle();
  return { title: data?.title ?? "Cours" };
}

export default async function Page({ params }: PageProps<"/dashboard/cours/[subject]/[id]">) {
  const account = await getAccount();
  if (!account) redirect("/connexion");

  const { subject: subjectId, id } = await params;
  const subject = getSubjects(account.level).find((s) => s.id === subjectId);
  if (!subject || !/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const supabase = await createClient();
  const { data: course } = await supabase
    .from("courses")
    .select("id, chapter, title, content, created_at")
    .eq("id", id)
    .eq("subject_id", subject.id)
    .maybeSingle();
  if (!course) notFound();

  return (
    <>
      <SubHeader title={subject.name} back={`/dashboard/cours/${subject.id}`} />
      {course.chapter && <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-brand">{course.chapter}</p>}
      <h1 className="mt-1 font-display text-2xl font-extrabold tracking-tight">{course.title}</h1>
      <div className="mt-5 max-w-3xl rounded-3xl bg-white p-5 ring-1 ring-ink/10 sm:p-7">
        {course.content.split(/\n{2,}/).map((paragraph: string, i: number) => (
          <p key={i} className="whitespace-pre-line leading-relaxed text-ink/90 [&:not(:first-child)]:mt-4">
            {paragraph}
          </p>
        ))}
      </div>
    </>
  );
}
