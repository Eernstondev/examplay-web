import Link from "next/link";
import { getT } from "@/lib/i18n/server";

export default async function NotFound() {
  const t = await getT();
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-5 py-20 text-center">
      <p className="text-[clamp(4rem,16vw,6.5rem)] font-semibold leading-none tracking-[-0.04em] text-ink/20">404</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">{t("Page introuvable")}</h1>
      <p className="mt-2 max-w-md leading-relaxed text-ink/70">
        {t("Cette page n'existe pas ou a été déplacée.")}
      </p>
      <Link href="/" className="mt-7 grid h-12 w-full max-w-xs place-items-center rounded-full bg-brand font-medium text-white hover:bg-brand-dark">
        {t("Retour à l'accueil")}
      </Link>
    </main>
  );
}
