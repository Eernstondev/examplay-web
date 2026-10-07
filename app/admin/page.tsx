import type { Metadata } from "next";
import Link from "next/link";
import { levelLabel } from "@/lib/content";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Vue d'ensemble" };

type Stats = {
  users: number;
  users_7d: number;
  by_level: Record<string, number>;
  by_department: Record<string, number>;
  questions: number;
  questions_inactive: number;
  results: number;
  results_7d: number;
  duels: number;
  waitlist: number;
  contacts: number;
};

const sorted = (o: Record<string, number>) => Object.entries(o).sort((a, b) => b[1] - a[1]);

export default async function Page() {
  const supabase = await createClient();
  const { data } = await supabase.rpc("admin_stats");
  const stats = data as Stats | null;

  const { data: pending } = await supabase.rpc("admin_pending");
  const todo = [
    { href: "/admin/signalements", label: "Signalements à traiter", n: Number(pending?.reports ?? 0) },
    { href: "/admin/propositions", label: "Propositions en attente", n: Number(pending?.submissions ?? 0) },
    { href: "/admin/contributeurs", label: "Demandes d'accès contributeur", n: Number(pending?.applications ?? 0) },
    { href: "/admin/messages", label: "Demandes de contact sur 7 jours", n: Number(pending?.contacts_7d ?? 0) },
  ].filter((t) => t.n > 0);

  if (!stats) {
    return <p className="text-ink/70">Les chiffres n&apos;ont pas pu être chargés.</p>;
  }

  const cards = [
    { label: "Élèves inscrits", value: stats.users, note: `+ ${stats.users_7d} sur 7 jours` },
    { label: "Quiz terminés", value: stats.results, note: `+ ${stats.results_7d} sur 7 jours` },
    { label: "Questions actives", value: stats.questions, note: `${stats.questions_inactive} désactivées` },
    { label: "Duels terminés", value: stats.duels, note: "" },
    { label: "Liste d'attente", value: stats.waitlist, note: "e-mails collectés" },
    { label: "Demandes de contact", value: stats.contacts, note: "page Investisseurs" },
  ];

  return (
    <>
      <h1 className="font-display text-3xl font-extrabold tracking-tight">Vue d&apos;ensemble</h1>
      {todo.length > 0 ? (
        <ul className="mt-6 grid gap-2 sm:grid-cols-2">
          {todo.map((t) => (
            <li key={t.href}>
              <Link href={t.href} className="flex items-center justify-between gap-3 rounded-2xl bg-ink p-4 text-white">
                <span className="font-semibold">{t.label}</span>
                <span className="rounded-full bg-sun px-3 py-1 font-display text-lg font-bold text-ink">{t.n}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-6 rounded-2xl bg-white p-4 text-ink/70 ring-1 ring-ink/10">Rien à traiter pour le moment.</p>
      )}

      <dl className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-3xl bg-white p-5 ring-1 ring-ink/10">
            <dt className="text-sm font-semibold text-ink/60">{c.label}</dt>
            <dd className="mt-1 font-display text-4xl font-extrabold leading-none">{c.value}</dd>
            {c.note && <dd className="mt-2 text-sm text-ink/60">{c.note}</dd>}
          </div>
        ))}
      </dl>

      <div className="mt-6 grid gap-3 lg:grid-cols-2">
        {[
          { title: "Élèves par série", rows: sorted(stats.by_level).map(([k, v]) => [levelLabel(k), v] as const) },
          { title: "Élèves par département", rows: sorted(stats.by_department) },
        ].map((block) => (
          <section key={block.title} className="rounded-3xl bg-white p-5 ring-1 ring-ink/10">
            <h2 className="font-display text-lg font-bold">{block.title}</h2>
            <ul className="mt-3 grid gap-2.5">
              {block.rows.map(([name, n]) => (
                <li key={name}>
                  <div className="flex justify-between gap-3 text-sm font-semibold">
                    <span>{name}</span>
                    <span className="tabular-nums">{n}</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-ink/10">
                    <div
                      className="h-full rounded-full bg-brand"
                      style={{ width: `${stats.users ? (n / stats.users) * 100 : 0}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
