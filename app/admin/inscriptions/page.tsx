import type { Metadata } from "next";
import { reviewEnrollment, saveCoursePaymentInfo, saveCoursePrices } from "@/app/admin/actions";
import { ALL_SUBJECTS, subjectName } from "@/lib/content";
import { formatDate, formatHtg } from "@/lib/enrollment";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Inscriptions" };

type Row = {
  id: string;
  subject_id: string;
  full_name: string;
  email: string | null;
  phone: string;
  price_htg: number;
  payment_ref: string;
  status: "pending" | "confirmed" | "rejected";
  admin_note: string | null;
  created_at: string;
  reviewed_at: string | null;
};

const inputClass = "mt-1.5 h-11 w-full rounded-xl border border-ink/20 bg-white px-3 text-base font-normal";

export default async function Page() {
  const supabase = await createClient();
  const [{ data: priceRows }, { data: info }, { data: enrollmentRows }] = await Promise.all([
    supabase.from("course_prices").select("subject_id, price_htg"),
    supabase.from("site_settings").select("value").eq("key", "course_payment_info").maybeSingle(),
    supabase
      .from("course_enrollments")
      .select("id, subject_id, full_name, email, phone, price_htg, payment_ref, status, admin_note, created_at, reviewed_at")
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  const prices = new Map((priceRows ?? []).map((p) => [p.subject_id, p.price_htg as number]));
  const rows = (enrollmentRows as Row[] | null) ?? [];
  const pending = rows.filter((r) => r.status === "pending").reverse();
  const history = rows.filter((r) => r.status !== "pending").slice(0, 30);

  return (
    <>
      <h1 className="font-display text-3xl font-extrabold tracking-tight">Inscriptions aux cours</h1>
      <p className="mb-6 mt-2 max-w-2xl text-ink/70">
        Fixe le prix de chaque matière. Une matière sans prix reste gratuite. Quand un élève s&apos;inscrit, vérifie son
        paiement MonCash ou NatCash avec l&apos;identifiant de transaction, puis confirme ou refuse.
      </p>

      <section className="mb-8">
        <h2 className="font-display text-xl font-bold">Demandes à traiter ({pending.length})</h2>
        {pending.length === 0 ? (
          <p className="mt-3 text-ink/70">Aucune demande en attente.</p>
        ) : (
          <ul className="mt-3 grid gap-3">
            {pending.map((r) => (
              <li key={r.id} className="rounded-3xl bg-white p-5 ring-1 ring-ink/10">
                <p className="font-semibold">
                  {r.full_name} · <span className="font-normal text-ink/70">{r.email ?? "(sans e-mail)"}</span>
                </p>
                <p className="mt-1 text-sm text-ink/80">
                  <strong>Téléphone :</strong> {r.phone} · <strong>Matière :</strong> {subjectName(r.subject_id)} ·{" "}
                  <strong>Prix :</strong> {formatHtg(r.price_htg)}
                </p>
                <p className="mt-1 text-sm text-ink/80">
                  <strong>Transaction :</strong> <span className="select-all font-mono">{r.payment_ref}</span> ·{" "}
                  <span className="text-ink/60">{formatDate(r.created_at)}</span>
                </p>
                <form action={reviewEnrollment} className="mt-3 flex flex-wrap items-end gap-2">
                  <input type="hidden" name="id" value={r.id} />
                  <label className="block min-w-48 flex-1 text-sm font-semibold">
                    Message à l&apos;élève (facultatif, utile si tu refuses)
                    <input name="note" maxLength={200} className={inputClass} />
                  </label>
                  <button type="submit" name="decision" value="approve" className="h-11 rounded-xl bg-success px-4 text-sm font-bold text-white">
                    Confirmer
                  </button>
                  <button type="submit" name="decision" value="reject" className="h-11 rounded-xl px-4 text-sm font-bold text-danger ring-1 ring-ink/15">
                    Refuser
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-8">
        <h2 className="font-display text-xl font-bold">Prix des cours (HTG)</h2>
        <form action={saveCoursePrices} className="mt-3 rounded-3xl bg-white p-5 ring-1 ring-ink/10">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ALL_SUBJECTS.map((s) => (
              <label key={s.id} className="block text-sm font-semibold">
                {s.label}
                <input
                  name={`price_${s.id}`}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={1000000}
                  step={1}
                  placeholder="Gratuit"
                  defaultValue={prices.get(s.id) ?? ""}
                  className={inputClass}
                />
              </label>
            ))}
          </div>
          <button type="submit" className="mt-5 h-12 rounded-xl bg-brand px-6 font-bold text-white hover:bg-brand-dark">
            Enregistrer les prix
          </button>
        </form>
      </section>

      <section className="mb-8">
        <h2 className="font-display text-xl font-bold">Consignes de paiement</h2>
        <form action={saveCoursePaymentInfo} className="mt-3 rounded-3xl bg-white p-5 ring-1 ring-ink/10">
          <label className="block text-sm font-semibold">
            Texte affiché dans le formulaire d&apos;inscription (numéro MonCash / NatCash, nom du bénéficiaire…)
            <textarea
              name="value"
              rows={3}
              maxLength={600}
              defaultValue={info?.value ?? ""}
              placeholder="Envoie le montant au 3X XX XX XX (MonCash, au nom de …)."
              className="mt-1.5 w-full rounded-xl border border-ink/20 bg-white px-3 py-2 text-base font-normal"
            />
          </label>
          <button type="submit" className="mt-4 h-12 rounded-xl bg-brand px-6 font-bold text-white hover:bg-brand-dark">
            Enregistrer
          </button>
        </form>
      </section>

      {history.length > 0 && (
        <section>
          <h2 className="font-display text-xl font-bold">Dernières décisions</h2>
          <ul className="mt-3 grid gap-2">
            {history.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-ink/10">
                <div className="min-w-0 flex-1 basis-56">
                  <p className="truncate font-semibold">{r.full_name}</p>
                  <p className="truncate text-sm text-ink/60">
                    {subjectName(r.subject_id)} · {formatHtg(r.price_htg)} · {r.phone}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-sm font-bold ${
                    r.status === "confirmed" ? "bg-success-soft text-success" : "bg-danger-soft text-danger"
                  }`}
                >
                  {r.status === "confirmed" ? "Confirmée" : "Refusée"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
