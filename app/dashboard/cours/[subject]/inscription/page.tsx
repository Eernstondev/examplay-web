import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { EnrollForm } from "@/components/app/enroll-form";
import { SubHeader, primaryButton } from "@/components/app/ui";
import { getSubjects } from "@/lib/content";
import { getAccount } from "@/lib/data";
import { formatHtg } from "@/lib/enrollment";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Inscription au cours" };

export default async function Page({ params }: PageProps<"/dashboard/cours/[subject]/inscription">) {
  const account = await getAccount();
  if (!account) redirect("/connexion");

  const { subject: subjectId } = await params;
  const subject = getSubjects(account.level).find((s) => s.id === subjectId);
  if (!subject) notFound();

  const supabase = await createClient();
  const [{ data: price }, { data: last }, { data: info }] = await Promise.all([
    supabase.from("course_prices").select("price_htg").eq("subject_id", subject.id).maybeSingle(),
    supabase
      .from("course_enrollments")
      .select("status, admin_note")
      .eq("user_id", account.id)
      .eq("subject_id", subject.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("site_settings").select("value").eq("key", "course_payment_info").maybeSingle(),
  ]);

  // Matière gratuite : rien à acheter.
  if (!price) redirect(`/dashboard/cours/${subject.id}`);

  const back = "/dashboard/cours";

  if (last?.status === "pending" || last?.status === "confirmed") {
    const confirmed = last.status === "confirmed";
    return (
      <>
        <SubHeader title={subject.name} back={back} />
        <section className="mt-5 max-w-xl rounded-3xl bg-white p-6 ring-1 ring-ink/10">
          <h2 className="font-display text-xl font-extrabold">
            {confirmed ? "Tu es inscrit" : "Inscription en cours de vérification"}
          </h2>
          <p className="mt-2 leading-relaxed text-ink/75">
            {confirmed
              ? "Les cours de cette matière sont débloqués."
              : "Nous vérifions ton paiement. Tu recevras une notification dès que c'est confirmé."}
          </p>
          <Link
            href={confirmed ? `/dashboard/cours/${subject.id}` : back}
            className={`${primaryButton} mt-5 sm:max-w-xs`}
          >
            {confirmed ? "Ouvrir les cours" : "Retour aux cours"}
          </Link>
        </section>
      </>
    );
  }

  return (
    <>
      <SubHeader title={`S'inscrire : ${subject.name}`} back={back} />
      {last?.status === "rejected" && (
        <p role="status" className="mt-2 max-w-xl rounded-2xl bg-danger-soft px-4 py-3 text-sm font-semibold text-danger">
          Ta dernière demande a été refusée{last.admin_note ? ` : ${last.admin_note}` : "."} Tu peux en envoyer une
          nouvelle.
        </p>
      )}
      <EnrollForm
        subject={subject.id}
        subjectName={subject.name}
        priceLabel={formatHtg(price.price_htg)}
        paymentInfo={info?.value ?? ""}
        defaultName={account.name === "élève" ? "" : account.name}
        email={account.email}
      />
    </>
  );
}
