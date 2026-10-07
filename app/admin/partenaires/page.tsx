import type { Metadata } from "next";
import Link from "next/link";
import { deletePartner } from "@/app/admin/actions";
import { PARTNER_CATEGORIES } from "@/lib/media";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Partenaires" };

export default async function Page() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("partners")
    .select("id, category, name, logo_url, active, order_index")
    .order("order_index")
    .order("created_at");
  const partners = data ?? [];

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Partenaires</h1>
        <Link href="/admin/partenaires/nouveau" className="grid h-12 place-items-center rounded-xl bg-brand px-5 font-bold text-white hover:bg-brand-dark">
          Nouveau partenaire
        </Link>
      </div>
      <p className="mt-2 text-ink/70">Ils apparaissent sur la page Collaborateurs du site, dans leur rubrique.</p>

      {PARTNER_CATEGORIES.map((category) => {
        const rows = partners.filter((p) => p.category === category.id);
        return (
          <section key={category.id} className="mt-7">
            <h2 className="font-display text-xl font-bold">
              {category.label} ({rows.length})
            </h2>
            {rows.length ? (
              <ul className="mt-3 grid gap-2">
                {rows.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-ink/10">
                    <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-brand-soft font-display font-bold text-brand">
                      {p.logo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.logo_url} alt="" className="size-full object-contain" />
                      ) : (
                        p.name.charAt(0).toUpperCase()
                      )}
                    </span>
                    <p className={`min-w-0 flex-1 basis-40 truncate font-semibold ${p.active ? "" : "text-ink/45"}`}>
                      {p.name}
                      {!p.active && <span className="ml-2 text-sm font-normal">Masqué</span>}
                    </p>
                    <form action={deletePartner}>
                      <input type="hidden" name="id" value={p.id} />
                      <button type="submit" className="h-11 rounded-xl px-4 text-sm font-bold text-danger ring-1 ring-ink/15">
                        Supprimer
                      </button>
                    </form>
                    <Link href={`/admin/partenaires/${p.id}`} className="grid h-11 place-items-center rounded-xl bg-brand-soft px-4 text-sm font-bold text-brand">
                      Modifier
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-ink/60">Aucun pour le moment.</p>
            )}
          </section>
        );
      })}
    </>
  );
}
