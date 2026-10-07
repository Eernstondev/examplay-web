import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdSlot } from "@/components/ad-slot";
import { DuelPlayer } from "@/components/app/duel-player";
import { SubHeader } from "@/components/app/ui";
import { getAccount } from "@/lib/data";

export const metadata: Metadata = { title: "Duel" };

export default async function Page({ searchParams }: PageProps<"/dashboard/duel">) {
  const account = await getAccount();
  if (!account) redirect("/connexion");

  const { id } = await searchParams;
  if (typeof id !== "string") redirect("/dashboard/communaute");

  return (
    <>
      <SubHeader title="Duel" back="/dashboard/communaute" />
      <DuelPlayer key={id} id={id} me={account.id} />
      <AdSlot
        placement="duel"
        target={{ department: account.department, level: account.level }}
        className="mt-7"
      />
    </>
  );
}
