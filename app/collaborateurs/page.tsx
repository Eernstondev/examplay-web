import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { SocialIcon } from "@/components/social-icon";
import { PARTNER_CATEGORIES, safeUrl } from "@/lib/media";
import { createPublicClient } from "@/lib/supabase/public";

export const metadata: Metadata = {
  title: "Collaborateurs",
  description: "Les partenaires, experts et institutions qui accompagnent Examplay.",
};

// Page mise en cache ; la zone admin la rafraîchit à chaque modification.
export const revalidate = 300;

type Partner = {
  id: string;
  category: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  website: string | null;
  facebook: string | null;
  instagram: string | null;
  tiktok: string | null;
};

const networks = [
  ["facebook", "Facebook"],
  ["instagram", "Instagram"],
  ["tiktok", "TikTok"],
] as const;

export default async function Page() {
  const { data } = await createPublicClient()
    .from("partners")
    .select("id, category, name, description, logo_url, website, facebook, instagram, tiktok")
    .order("order_index")
    .order("created_at");
  const partners = (data as Partner[] | null) ?? [];

  return (
    <PageShell
      title="L'écosystème Examplay"
      lead="Examplay grandit grâce à la confiance de ses partenaires. Découvrez les entités et les personnes qui rendent cette aventure possible."
    >
      {PARTNER_CATEGORIES.map((category) => {
        const rows = partners.filter((p) => p.category === category.id);
        return (
          <section key={category.id} className="border-t border-ink/10 py-10 first:border-t-0 first:pt-0">
            <h2 className="font-display text-[clamp(1.5rem,5.5vw,2rem)] font-bold tracking-tight">
              {category.label}
            </h2>
            {rows.length ? (
              <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {rows.map((p) => {
                  const website = p.website && safeUrl(p.website);
                  return (
                    <li key={p.id} className="flex flex-col rounded-3xl bg-brand-soft p-6">
                      <span className="grid size-20 place-items-center overflow-hidden rounded-2xl bg-white font-display text-3xl font-bold text-brand ring-1 ring-ink/10">
                        {p.logo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.logo_url} alt={`Logo ${p.name}`} loading="lazy" className="size-full object-contain p-2" />
                        ) : (
                          p.name.charAt(0).toUpperCase()
                        )}
                      </span>
                      <h3 className="mt-4 font-display text-xl font-semibold leading-snug">{p.name}</h3>
                      {p.description && (
                        <p className="mt-2 whitespace-pre-line leading-relaxed text-ink/70">{p.description}</p>
                      )}
                      <div className="mt-auto flex flex-wrap items-center gap-2 pt-5">
                        {networks.map(([key, label]) => {
                          const href = p[key] && safeUrl(p[key]);
                          return href ? (
                            <a
                              key={key}
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`${p.name} sur ${label}`}
                              className="grid size-11 place-items-center rounded-full bg-white text-ink ring-1 ring-ink/10 transition-colors hover:bg-brand hover:text-white"
                            >
                              <SocialIcon name={label} className="size-[18px]" />
                            </a>
                          ) : null;
                        })}
                        {website && (
                          <a
                            href={website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="grid h-11 place-items-center rounded-full bg-white px-4 text-sm font-bold text-brand ring-1 ring-ink/10 hover:bg-brand hover:text-white"
                          >
                            Site web
                          </a>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-3 text-ink/70">
                Aucun nom annoncé pour le moment.{" "}
                <Link href="/contact" className="font-semibold text-brand underline underline-offset-4">
                  Contactez-nous pour rejoindre Examplay
                </Link>
                .
              </p>
            )}
          </section>
        );
      })}
    </PageShell>
  );
}
