import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SubHeader } from "@/components/app/ui";
import { getSubjects } from "@/lib/content";
import { getAccount } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Cours" };

export default async function Page() {
  const account = await getAccount();
  if (!account) redirect("/connexion");

  const supabase = await createClient();
  const { data } = await supabase.from("courses").select("subject_id");
  const counts = new Map<string, number>();
  (data ?? []).forEach((c) => counts.set(c.subject_id, (counts.get(c.subject_id) ?? 0) + 1));

  const subjects = getSubjects(account.level).filter((s) => counts.get(s.id));

  return (
    <>
      <SubHeader title="Cours" />
      {subjects.length === 0 ? (
        <p className="py-10 text-center text-ink/70">Aucun cours publié pour le moment.</p>
      ) : (
        <ul className="mt-5 grid gap-2.5 md:grid-cols-2">
          {subjects.map((s) => (
            <li key={s.id}>
              <Link
                href={`/dashboard/cours/${s.id}`}
                className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4 ring-1 ring-ink/10 transition-transform hover:ring-2 hover:ring-brand active:scale-[0.98]"
              >
                <span className="font-display text-lg font-semibold">{s.name}</span>
                <span className="shrink-0 text-sm font-semibold text-ink/60">{counts.get(s.id)} cours</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
