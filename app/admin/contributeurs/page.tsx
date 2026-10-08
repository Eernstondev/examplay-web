import type { Metadata } from "next";
import { removeContributor, reviewApplication } from "@/app/admin/actions";
import { ContributorForm } from "@/components/admin/contributor-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Contributeurs" };

type Application = { user_id: string; name: string; email: string; subjects: string; school: string; message: string | null };
type Row = { id: string; name: string; email: string; created_at: string; pending: number; approved: number };

export default async function Page() {
  const supabase = await createClient();
  const [{ data }, { data: pending }] = await Promise.all([
    supabase.rpc("admin_list_contributors"),
    supabase.rpc("admin_list_applications"),
  ]);
  const rows = (data as Row[] | null) ?? [];
  const applications = (pending as Application[] | null) ?? [];

  return (
    <>
      <h1 className="font-display text-3xl font-extrabold tracking-tight">Contributeurs</h1>
      <p className="mb-5 mt-2 max-w-2xl text-ink/70">
        Les enseignants et experts à qui tu donnes l&apos;accès peuvent proposer des questions et des
        corrections depuis <strong>/contribuer</strong>. Rien n&apos;est publié sans ta validation.
      </p>
      {applications.length > 0 && (
        <section className="mb-7">
          <h2 className="font-display text-xl font-bold">Demandes d&apos;accès ({applications.length})</h2>
          <ul className="mt-3 grid gap-3">
            {applications.map((a) => (
              <li key={a.user_id} className="rounded-3xl bg-white p-5 ring-1 ring-ink/10">
                <p className="font-semibold">
                  {a.name || "(sans nom)"} · <span className="font-normal text-ink/70">{a.email}</span>
                </p>
                <p className="mt-1 text-sm text-ink/75">
                  <strong>Matières :</strong> {a.subjects} · <strong>Établissement :</strong> {a.school}
                </p>
                {a.message && <p className="mt-2 whitespace-pre-wrap rounded-xl bg-brand-soft px-3 py-2 text-sm">{a.message}</p>}
                <form action={reviewApplication} className="mt-3 flex flex-wrap gap-2">
                  <input type="hidden" name="id" value={a.user_id} />
                  <button type="submit" name="decision" value="approve" className="h-11 rounded-xl bg-success px-4 text-sm font-bold text-white">
                    Donner l&apos;accès
                  </button>
                  <button type="submit" name="decision" value="reject" className="h-11 rounded-xl px-4 text-sm font-bold text-danger ring-1 ring-ink/15">
                    Refuser
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}
      <h2 className="mb-3 font-display text-xl font-bold">Ajouter directement</h2>
      <ContributorForm />

      {rows.length ? (
        <ul className="mt-5 grid gap-2">
          {rows.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-ink/10">
              <div className="min-w-0 flex-1 basis-56">
                <p className="truncate font-semibold">{c.name || "(sans nom)"}</p>
                <p className="truncate text-sm text-ink/60">{c.email}</p>
              </div>
              <p className="text-sm text-ink/70">
                {Number(c.approved)} publiée{Number(c.approved) > 1 ? "s" : ""} · {Number(c.pending)} en attente
              </p>
              <form action={removeContributor}>
                <input type="hidden" name="id" value={c.id} />
                <button type="submit" className="h-11 rounded-xl px-4 text-sm font-bold text-danger ring-1 ring-ink/15">
                  Retirer l&apos;accès
                </button>
              </form>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-6 text-ink/70">Aucun contributeur pour le moment.</p>
      )}
    </>
  );
}
