import type { Metadata } from "next";
import Link from "next/link";
import { setUserSuspended } from "@/app/admin/actions";
import { levelLabel } from "@/lib/content";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Utilisateurs" };

const PAGE_SIZE = 50;
type Row = {
  id: string;
  name: string;
  email: string;
  level: string;
  department: string;
  created_at: string;
  quizzes: number;
  suspended: boolean;
  total: number;
};

export default async function Page({ searchParams }: PageProps<"/admin/utilisateurs">) {
  const params = await searchParams;
  const search = typeof params.q === "string" ? params.q.trim() : "";
  const page = Math.max(1, Number(params.page) || 1);

  const supabase = await createClient();
  const { data } = await supabase.rpc("admin_list_users", {
    p_search: search,
    p_limit: PAGE_SIZE,
    p_offset: (page - 1) * PAGE_SIZE,
  });
  const rows = (data as Row[] | null) ?? [];
  const total = rows.length ? Number(rows[0].total) : 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const link = (p: number) => `/admin/utilisateurs?${new URLSearchParams({ q: search, page: String(p) })}`;
  const date = new Intl.DateTimeFormat("fr-FR", { timeZone: "America/Port-au-Prince", dateStyle: "medium" });

  return (
    <>
      <h1 className="font-display text-3xl font-extrabold tracking-tight">Utilisateurs</h1>

      <form className="mt-5 flex gap-3">
        <label className="flex-1 text-sm font-semibold">
          <span className="sr-only">Rechercher par nom ou e-mail</span>
          <input
            type="search"
            name="q"
            defaultValue={search}
            placeholder="Nom ou e-mail"
            className="h-12 w-full rounded-xl border border-ink/20 bg-white px-4 text-base font-normal"
          />
        </label>
        <button type="submit" className="h-12 rounded-xl bg-ink px-5 font-bold text-white">
          Rechercher
        </button>
      </form>

      <p className="mt-4 text-sm text-ink/70">
        {total} élève{total > 1 ? "s" : ""}
      </p>

      {rows.length ? (
        <div className="mt-3 overflow-x-auto rounded-3xl bg-white ring-1 ring-ink/10">
          <table className="w-full min-w-[54rem] text-left text-sm">
            <thead className="text-ink/60">
              <tr>
                {["Nom", "E-mail", "Série", "Département", "Quiz", "Inscrit le", "Accès"].map((h) => (
                  <th key={h} scope="col" className="px-4 py-3 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.id} className="border-t border-ink/10">
                  <th scope="row" className="px-4 py-3 font-semibold">
                    {u.name || "(sans nom)"}
                    {u.suspended && <span className="ml-2 rounded-full bg-danger-soft px-2 py-0.5 text-xs font-bold text-danger">Suspendu</span>}
                  </th>
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3">{levelLabel(u.level)}</td>
                  <td className="px-4 py-3">{u.department}</td>
                  <td className="px-4 py-3 tabular-nums">{Number(u.quizzes)}</td>
                  <td className="px-4 py-3">{date.format(new Date(u.created_at))}</td>
                  <td className="px-4 py-2">
                    <form action={setUserSuspended}>
                      <input type="hidden" name="id" value={u.id} />
                      <input type="hidden" name="suspended" value={String(!u.suspended)} />
                      <button
                        type="submit"
                        className={`h-10 rounded-lg px-3 text-sm font-bold ring-1 ring-ink/15 ${u.suspended ? "text-brand" : "text-danger"}`}
                      >
                        {u.suspended ? "Réactiver" : "Suspendre"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-8 text-center text-ink/70">Aucun élève trouvé.</p>
      )}

      {pages > 1 && (
        <nav aria-label="Pagination" className="mt-5 flex items-center justify-between gap-3">
          {page > 1 ? (
            <Link href={link(page - 1)} className="grid h-11 place-items-center rounded-xl bg-white px-4 text-sm font-bold ring-1 ring-ink/15">
              Précédent
            </Link>
          ) : (
            <span />
          )}
          <span className="text-sm text-ink/70">
            Page {page} sur {pages}
          </span>
          {page < pages ? (
            <Link href={link(page + 1)} className="grid h-11 place-items-center rounded-xl bg-white px-4 text-sm font-bold ring-1 ring-ink/15">
              Suivant
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </>
  );
}
