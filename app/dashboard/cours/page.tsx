import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EnrollAction } from "@/components/app/enroll-action";
import { SubHeader } from "@/components/app/ui";
import { getSubjects } from "@/lib/content";
import { getAccount } from "@/lib/data";
import { latestByStatus, type EnrollmentStatus } from "@/lib/enrollment";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Cours" };

export default async function Page() {
  const account = await getAccount();
  if (!account) redirect("/connexion");

  const supabase = await createClient();
  const [counted, { data: priceRows }, { data: mine }] = await Promise.all([
    supabase.rpc("course_counts"),
    supabase.from("course_prices").select("subject_id, price_htg"),
    supabase
      .from("course_enrollments")
      .select("subject_id, status")
      .eq("user_id", account.id)
      .order("created_at", { ascending: false }),
  ]);

  const counts = new Map<string, number>();
  if (counted.error) {
    // Fonction course_counts pas encore installée : ancien comptage.
    const { data } = await supabase.from("courses").select("subject_id");
    (data ?? []).forEach((c) => counts.set(c.subject_id, (counts.get(c.subject_id) ?? 0) + 1));
  } else {
    ((counted.data as { subject_id: string; total: number }[] | null) ?? []).forEach((c) =>
      counts.set(c.subject_id, Number(c.total)),
    );
  }
  const prices = new Map((priceRows ?? []).map((p) => [p.subject_id, p.price_htg as number]));
  const enrollments = latestByStatus(mine ?? []);

  const subjects = getSubjects(account.level);

  return (
    <>
      <SubHeader title="Cours" />
      <ul className="mt-5 grid gap-2.5 md:grid-cols-2">
        {subjects.map((s) => {
          const total = counts.get(s.id) ?? 0;
          const price = prices.get(s.id);
          const status = (enrollments.get(s.id)?.status ?? null) as EnrollmentStatus | null;
          const open = price === undefined ? total > 0 : status === "confirmed";
          const label = (
            <>
              <span className="block font-display text-lg font-semibold">{s.name}</span>
              <span className="block text-sm text-ink/60">{total > 0 ? `${total} cours` : "Bientôt"}</span>
            </>
          );
          return (
            <li key={s.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4 ring-1 ring-ink/10">
              {open ? (
                <Link href={`/dashboard/cours/${s.id}`} className="min-w-0 flex-1 hover:text-brand">
                  {label}
                </Link>
              ) : (
                <div className="min-w-0 flex-1">{label}</div>
              )}
              {price === undefined ? (
                total > 0 && <span className="shrink-0 text-sm font-semibold text-success">Gratuit</span>
              ) : (
                <EnrollAction subject={s.id} price={price} status={status} />
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
