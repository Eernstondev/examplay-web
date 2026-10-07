import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { signOut } from "@/app/actions";
import { RealtimeHub } from "@/components/app/realtime-hub";
import { isAdmin, isContributor } from "@/lib/admin";
import { getAccount } from "@/lib/data";
import { site } from "@/lib/site";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const account = await getAccount();
  if (!account) redirect("/connexion");
  // Le compte admin n'a pas d'espace élève.
  if (await isAdmin()) redirect("/admin");
  const contributor = await isContributor();

  return (
    <div className="flex flex-1 flex-col bg-brand-soft">
      <RealtimeHub
        id={account.id}
        name={account.name}
        department={account.department}
        level={account.level}
      />
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="" width={40} height={40} priority className="rounded-[10px]" />
          <span className="font-display text-xl font-bold tracking-tight">{site.name}</span>
        </Link>
        <div className="flex items-center gap-1.5">
          {contributor && (
            <Link href="/contribuer" className="grid min-h-11 place-items-center rounded-lg px-3 text-sm font-semibold text-brand">
              Contribuer
            </Link>
          )}
          <form action={signOut}>
            <button
              type="submit"
              className="min-h-11 rounded-lg px-3 text-sm font-semibold text-ink/70 hover:text-brand"
            >
              Se déconnecter
            </button>
          </form>
          <Link
            href="/dashboard/profil"
            aria-label="Mon profil"
            className="grid size-11 place-items-center rounded-full bg-brand font-display text-lg font-bold text-white"
          >
            {account.name.charAt(0).toUpperCase()}
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 pb-[calc(2.5rem+env(safe-area-inset-bottom))] sm:px-8">
        {children}
      </main>
    </div>
  );
}
