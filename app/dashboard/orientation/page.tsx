import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SubHeader } from "@/components/app/ui";
import { levelLabel } from "@/lib/content";
import { getAccount } from "@/lib/data";
import { orientation } from "@/lib/orientation";
import { getT } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Orientation" };

export default async function Page() {
  const t = await getT();
  const account = await getAccount();
  if (!account) redirect("/connexion");

  const data = orientation[account.level];
  if (!data) redirect("/dashboard");

  return (
    <>
      <SubHeader title={t("Ton avenir après le NS4")} />
      <p className="max-w-2xl text-[1.0625rem] leading-relaxed text-ink/75">
        <strong className="font-semibold text-ink">{levelLabel(account.level)}.</strong> {data.intro}
      </p>

      <h2 className="mt-7 text-xl font-semibold">{t("Ce que tu peux étudier")}</h2>
      <ul className="mt-3 grid gap-2.5 md:grid-cols-2">
        {data.paths.map((p) => (
          <li key={p.field} className="rounded-2xl bg-surface p-4 ring-1 ring-ink/[0.06]">
            <p className="text-lg font-semibold">{p.field}</p>
            <p className="mt-1 leading-relaxed text-ink/70">{p.examples}</p>
          </li>
        ))}
      </ul>

      <h2 className="mt-7 text-xl font-semibold">{t("Où étudier en Haïti")}</h2>
      <ul className="mt-3 grid gap-2.5 md:grid-cols-2">
        {data.places.map((p) => (
          <li key={p.name} className="rounded-2xl bg-surface p-4 ring-1 ring-ink/[0.06]">
            <p className="font-semibold leading-snug">{p.name}</p>
            <p className="mt-1 text-sm leading-relaxed text-ink/70">{p.detail}</p>
          </li>
        ))}
      </ul>

      <p className="mt-6 max-w-2xl rounded-2xl bg-surface p-4 text-sm leading-relaxed text-ink/70 ring-1 ring-ink/[0.06]">
        {t("Cette liste est indicative. Les filières, les conditions et les concours d'admission changent : vérifie toujours auprès de l'établissement avant de t'inscrire. Ta série ne t'enferme pas, d'autres filières restent possibles.")}
      </p>
    </>
  );
}
