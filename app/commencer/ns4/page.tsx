import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { ns4Tracks } from "@/lib/levels";
import { getT } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Choisis ta série NS4" };

export default async function Page() {
  const t = await getT();
  return (
    <AuthShell wide title={t("Choisis ta série NS4")} lead={t("Les questions seront adaptées à ta filière.")}>
      <ul className="grid gap-3 sm:grid-cols-2">
        {ns4Tracks.map((track) => (
          <li key={track.slug}>
            <Link
              href={`/connexion?niveau=${track.slug}`}
              className="flex min-h-20 items-center gap-4 rounded-2xl bg-ink/[0.035] p-4 ring-1 ring-transparent transition hover:ring-brand/40 active:scale-[0.98]"
            >
              <span className="grid h-12 w-16 shrink-0 place-items-center rounded-xl bg-brand-soft text-lg font-semibold text-brand-fg">
                {track.code}
              </span>
              <span className="font-medium leading-snug">{track.name}</span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-7">
        <Link href="/commencer" className="font-medium text-brand-fg underline underline-offset-4">
          {t("Retour au choix du niveau")}
        </Link>
      </p>
    </AuthShell>
  );
}
