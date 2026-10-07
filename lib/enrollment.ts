export type EnrollmentStatus = "pending" | "confirmed" | "rejected";

export const formatHtg = (amount: number) => `${amount.toLocaleString("fr-FR")} HTG`;

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Port-au-Prince",
  });

// Parmi les demandes d'un élève (de la plus récente à la plus ancienne), garde par matière
// la demande active (en attente ou confirmée), à défaut la dernière refusée.
export function latestByStatus<T extends { subject_id: string; status: string }>(rows: T[]) {
  const map = new Map<string, T>();
  for (const row of rows) {
    const current = map.get(row.subject_id);
    if (!current || (current.status === "rejected" && row.status !== "rejected")) map.set(row.subject_id, row);
  }
  return map;
}
