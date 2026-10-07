import Link from "next/link";
import type { EnrollmentStatus } from "@/lib/enrollment";
import { formatHtg } from "@/lib/enrollment";

// Bouton ou pastille d'état d'une matière payante : S'inscrire, en cours, inscrit.
export function EnrollAction({
  subject,
  price,
  status,
}: {
  subject: string;
  price: number;
  status: EnrollmentStatus | null;
}) {
  if (status === "confirmed") {
    return <span className="shrink-0 rounded-full bg-success-soft px-3 py-1.5 text-sm font-bold text-success">Inscrit</span>;
  }
  if (status === "pending") {
    return (
      <Link
        href={`/dashboard/cours/${subject}/inscription`}
        className="shrink-0 rounded-full bg-sun/25 px-3 py-1.5 text-sm font-bold text-ink"
      >
        En cours de vérification
      </Link>
    );
  }
  return (
    <span className="flex shrink-0 flex-col items-end gap-1">
      <span className="text-sm font-semibold text-ink/70">{formatHtg(price)}</span>
      <Link
        href={`/dashboard/cours/${subject}/inscription`}
        className="grid h-11 place-items-center rounded-xl bg-brand px-4 text-sm font-bold text-white hover:bg-brand-dark"
      >
        {status === "rejected" ? "Réessayer" : "S'inscrire"}
      </Link>
    </span>
  );
}
