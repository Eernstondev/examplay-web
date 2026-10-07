import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { EnrollAction } from "@/components/app/enroll-action";
import { SubHeader } from "@/components/app/ui";
import { getSubjects } from "@/lib/content";
import { getAccount } from "@/lib/data";
import type { EnrollmentStatus } from "@/lib/enrollment";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Cours" };

export default async function Page({ params }: PageProps<"/dashboard/cours/[subject]">) {
  const account = await getAccount();
  if (!account) redirect("/connexion");

  const { subject: subjectId } = await params;
  const subject = getSubjects(account.level).find((s) => s.id === subjectId);
  if (!subject) notFound();

  const supabase = await createClient();
  // Les règles de la base ne renvoient les cours d'une matière payante qu'aux inscrits confirmés.
  const [{ data }, { data: price }, { data: mine }] = await Promise.all([
    supabase
      .from("courses")
      .select("id, chapter, title, created_at")
      .eq("subject_id", subject.id)
      .order("chapter", { ascending: true, nullsFirst: true })
      .order("created_at", { ascending: false }),
    supabase.from("course_prices").select("price_htg").eq("subject_id", subject.id).maybeSingle(),
    supabase
      .from("course_enrollments")
      .select("status")
      .eq("user_id", account.id)
      .eq("subject_id", subject.id)
      .order("created_at", { ascending: false })
      .limit(2),
  ]);
  const courses = data ?? [];
  const statuses = (mine ?? []).map((m) => m.status as EnrollmentStatus);
  const status = statuses.find((s) => s !== "rejected") ?? statuses[0] ?? null;

  if (price && status !== "confirmed" && courses.length === 0) {
    return (
      <>
        <SubHeader title={subject.name} back="/dashboard/cours" />
        <section className="mt-5 flex max-w-xl flex-wrap items-center justify-between gap-4 rounded-3xl bg-white p-6 ring-1 ring-ink/10">
          <div className="min-w-0 flex-1 basis-56">
            <h2 className="font-display text-xl font-extrabold">Cours réservés aux inscrits</h2>
            <p className="mt-1 text-sm leading-relaxed text-ink/70">
              Inscris-toi pour débloquer tous les cours de {subject.name}.
            </p>
          </div>
          <EnrollAction subject={subject.id} price={price.price_htg} status={status} />
        </section>
      </>
    );
  }

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
