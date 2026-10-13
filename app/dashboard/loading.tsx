
import { getT } from "@/lib/i18n/server";export default async function Loading() {
  const t = await getT();
  return (
    <div role="status" className="flex flex-1 flex-col items-center justify-center gap-4 px-5 py-24">
      <span className="size-10 animate-spin rounded-full border-4 border-brand/20 border-t-brand" />
      <p className="text-sm font-semibold text-ink/60">{t("Chargement…")}</p>
    </div>
  );
}
