import type { Metadata } from "next";
import Link from "next/link";
import { deleteAd } from "@/app/admin/actions";
import { AD_AUDIENCES, AD_DISPLAY_MODES, AD_PLACEMENTS } from "@/lib/media";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Publicités" };

function status(ad: { active: boolean; starts_on: string | null; ends_on: string | null }, today: string) {
  if (!ad.active) return { label: "Désactivée", className: "bg-ink/10 text-ink/60" };
  if (ad.starts_on && ad.starts_on > today) return { label: "Programmée", className: "bg-brand-soft text-brand-fg" };
  if (ad.ends_on && ad.ends_on < today) return { label: "Terminée", className: "bg-ink/10 text-ink/60" };
  return { label: "En ligne", className: "bg-success-soft text-success-fg" };
}

export default async function Page() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ads")
    .select("id, title, image_url, media_type, display_mode, link_url, placements, departments, audience, starts_on, ends_on, active, clicks, impressions")
    .order("created_at", { ascending: false });
  const ads = data ?? [];
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Port-au-Prince" }).format(new Date());

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Publicités</h1>
        <Link href="/admin/publicites/nouveau" className="grid h-12 place-items-center rounded-xl bg-brand px-5 font-bold text-white hover:bg-brand-dark">
          Nouvelle publicité
        </Link>
      </div>

      {ads.length ? (
        <ul className="mt-6 grid gap-3 lg:grid-cols-2">
          {ads.map((ad) => {
            const s = status(ad, today);
            const departments = ad.departments as string[];
            return (
              <li key={ad.id} className="rounded-3xl bg-surface p-4 ring-1 ring-ink/10">
                {ad.media_type === "video" ? (
                  <video src={ad.image_url} controls muted playsInline preload="metadata" className="aspect-[3/1] w-full rounded-2xl bg-navy object-cover" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={ad.image_url} alt="" className="aspect-[3/1] w-full rounded-2xl object-cover" />
                )}
                <div className="mt-3 flex items-start justify-between gap-3">
                  <p className="font-display text-lg font-semibold leading-snug">{ad.title}</p>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${s.className}`}>{s.label}</span>
                </div>
                <dl className="mt-2 grid gap-1 text-sm text-ink/70">
                  <div>
                    <dt className="inline font-semibold text-ink">Format : </dt>
                    <dd className="inline">{AD_DISPLAY_MODES.find((m) => m.id === ad.display_mode)?.label ?? ad.display_mode}</dd>
                  </div>
                  <div>
                    <dt className="inline font-semibold text-ink">Où : </dt>
                    <dd className="inline">
                      {(ad.placements as string[])
                        .map((p) => AD_PLACEMENTS.find((x) => x.id === p)?.label ?? p)
                        .join(", ")}
                    </dd>
                  </div>
                  <div>
                    <dt className="inline font-semibold text-ink">Cible : </dt>
                    <dd className="inline">
                      {departments.length ? departments.join(", ") : "Tous les départements"} ·{" "}
                      {AD_AUDIENCES.find((a) => a.id === ad.audience)?.label}
                    </dd>
                  </div>
                  <div>
                    <dt className="inline font-semibold text-ink">Période : </dt>
                    <dd className="inline">
                      {ad.starts_on || ad.ends_on
                        ? `${ad.starts_on ?? "dès maintenant"} → ${ad.ends_on ?? "sans fin"}`
                        : "Sans limite"}
                    </dd>
                  </div>
                  <div>
                    <dt className="inline font-semibold text-ink">Affichages : </dt>
                    <dd className="inline">{ad.impressions}</dd>
                  </div>
                  <div>
                    <dt className="inline font-semibold text-ink">Clics : </dt>
                    <dd className="inline">
                      {ad.link_url
                        ? `${ad.clicks}${ad.impressions ? ` (${((ad.clicks / ad.impressions) * 100).toFixed(1)} %)` : ""}`
                        : "pas de lien"}
                    </dd>
                  </div>
                </dl>
                <div className="mt-3 flex gap-2">
                  <Link href={`/admin/publicites/${ad.id}`} className="grid h-11 flex-1 place-items-center rounded-xl bg-brand-soft text-sm font-bold text-brand-fg">
                    Modifier
                  </Link>
                  <form action={deleteAd}>
                    <input type="hidden" name="id" value={ad.id} />
                    <button type="submit" className="h-11 rounded-xl px-4 text-sm font-bold text-danger-fg ring-1 ring-ink/15">
                      Supprimer
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-8 text-center text-ink/70">Aucune publicité pour le moment.</p>
      )}
    </>
  );
}
