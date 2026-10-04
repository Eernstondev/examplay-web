import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { ns4Tracks } from "@/lib/levels";

export const metadata: Metadata = { title: "Choisis ta série NS4" };

export default function Page() {
  return (
    <AuthShell wide title="Choisis ta série NS4" lead="Les questions seront adaptées à ta filière.">
      <ul className="grid gap-3 sm:grid-cols-2">
        {ns4Tracks.map((track) => (
          <li key={track.slug}>
            <Link
              href={`/connexion?niveau=${track.slug}`}
              className="flex min-h-20 items-center gap-4 rounded-2xl bg-white p-4 ring-1 ring-ink/10 transition-transform hover:ring-2 hover:ring-brand active:scale-[0.98]"
            >
              <span className="grid h-12 w-16 shrink-0 place-items-center rounded-xl bg-brand font-display text-lg font-bold text-white">
                {track.code}
              </span>
              <span className="font-semibold leading-snug">{track.name}</span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-7">
        <Link href="/commencer" className="font-semibold text-brand underline underline-offset-4">
          Retour au choix du niveau
        </Link>
      </p>
    </AuthShell>
  );
}
