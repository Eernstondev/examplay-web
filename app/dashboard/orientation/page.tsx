import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SubHeader } from "@/components/app/ui";
import { levelLabel } from "@/lib/content";
import { getAccount } from "@/lib/data";
import { orientation } from "@/lib/orientation";

export const metadata: Metadata = { title: "Orientation" };

export default async function Page() {
  const account = await getAccount();
  if (!account) redirect("/connexion");

  const data = orientation[account.level];
  if (!data) redirect("/dashboard");

  return (
    <>
      <SubHeader title="Ton avenir après le NS4" />
      <p className="max-w-2xl text-[1.0625rem] leading-relaxed text-ink/75">
        <strong className="font-semibold text-ink">{levelLabel(account.level)}.</strong> {data.intro}
      </p>

      <h2 className="mt-7 font-display text-xl font-bold">Ce que tu peux étudier</h2>
      <ul className="mt-3 grid gap-2.5 md:grid-cols-2">
        {data.paths.map((p) => (
          <li key={p.field} className="rounded-2xl bg-white p-4 ring-1 ring-ink/10">
            <p className="font-display text-lg font-semibold">{p.field}</p>
            <p className="mt-1 leading-relaxed text-ink/70">{p.examples}</p>
          </li>
        ))}
      </ul>

      <h2 className="mt-7 font-display text-xl font-bold">Où étudier en Haïti</h2>
      <ul className="mt-3 grid gap-2.5 md:grid-cols-2">
        {data.places.map((p) => (
          <li key={p.name} className="rounded-2xl bg-white p-4 ring-1 ring-ink/10">
            <p className="font-semibold leading-snug">{p.name}</p>
            <p className="mt-1 text-sm leading-relaxed text-ink/70">{p.detail}</p>
          </li>
        ))}
      </ul>

      <p className="mt-6 max-w-2xl rounded-2xl bg-white p-4 text-sm leading-relaxed text-ink/70 ring-1 ring-ink/10">
        Cette liste est indicative. Les filières, les conditions et les concours d&apos;admission changent : vérifie
        toujours auprès de l&apos;établissement avant de t&apos;inscrire. Ta série ne t&apos;enferme pas, d&apos;autres
        filières restent possibles.
      </p>
    </>
  );
}
