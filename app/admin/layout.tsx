import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import { signOut } from "@/app/actions";
import { AdminNav } from "@/components/admin/admin-nav";
import { isAdmin } from "@/lib/admin";
import { getAccount } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: { default: "Administration", template: "%s | Admin Examplay" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const account = await getAccount();
  if (!account) redirect("/connexion");
  // Un non-admin voit une page introuvable : rien n'indique que la zone existe.
  if (!(await isAdmin())) notFound();

  // Compteurs « à traiter » affichés dans le menu.
  const supabase = await createClient();
  const { data: pending } = await supabase.rpc("admin_pending");
  const counts = {
    "/admin/signalements": Number(pending?.reports ?? 0),
    "/admin/propositions": Number(pending?.submissions ?? 0),
    "/admin/contributeurs": Number(pending?.applications ?? 0),
    "/admin/inscriptions": Number(pending?.enrollments ?? 0),
    "/admin/messages": Number(pending?.contacts_7d ?? 0),
  };

  return (
    <div className="flex flex-1 flex-col bg-brand-soft">
      <header className="border-b border-ink/10 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
          <Link href="/admin" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="" width={36} height={36} priority className="rounded-[9px]" />
            <span className="font-display text-lg font-bold tracking-tight">Admin</span>
          </Link>
          <div className="flex items-center gap-1">
            <form action={signOut}>
              <button type="submit" className="min-h-11 px-3 text-sm font-semibold text-ink/70 hover:text-brand">
                Se déconnecter
              </button>
            </form>
          </div>
        </div>
        <AdminNav counts={counts} />
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-7 sm:px-8">{children}</main>
    </div>
  );
}
