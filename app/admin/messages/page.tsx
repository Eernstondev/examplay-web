import type { Metadata } from "next";
import { contactSubjects } from "@/lib/contact";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Messages" };

export default async function Page() {
  const supabase = await createClient();
  const [contacts, waitlist] = await Promise.all([
    supabase
      .from("contact_requests")
      .select("id, name, email, subject, message, created_at")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("waitlist")
      .select("id, email, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(200),
  ]);
  const date = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "America/Port-au-Prince",
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <>
      <h1 className="font-display text-3xl font-extrabold tracking-tight">Messages</h1>

      <h2 className="mt-6 font-display text-xl font-bold">Demandes de contact</h2>
      {contacts.data?.length ? (
        <ul className="mt-3 grid gap-3">
          {contacts.data.map((c) => (
            <li key={c.id} className="rounded-3xl bg-surface p-5 ring-1 ring-ink/10">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <p className="font-semibold">
                  {c.name} ·{" "}
                  <a href={`mailto:${c.email}`} className="text-brand-fg underline underline-offset-2">
                    {c.email}
                  </a>
                </p>
                <p className="text-sm text-ink/60">{date.format(new Date(c.created_at))}</p>
              </div>
              <p className="mt-1 text-sm font-semibold text-ink/60">
                {contactSubjects.find((s) => s.value === c.subject)?.label ?? c.subject}
              </p>
              <p className="mt-3 whitespace-pre-wrap leading-relaxed">{c.message}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-ink/70">Aucune demande pour le moment.</p>
      )}

      <h2 className="mt-8 font-display text-xl font-bold">
        Liste d&apos;attente ({waitlist.count ?? 0})
      </h2>
      {waitlist.data?.length ? (
        <ul className="mt-3 grid gap-x-6 rounded-3xl bg-surface p-5 ring-1 ring-ink/10 sm:grid-cols-2 lg:grid-cols-3">
          {waitlist.data.map((w) => (
            <li key={w.id} className="truncate border-b border-ink/10 py-2 text-sm">
              {w.email}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-ink/70">Aucun e-mail collecté.</p>
      )}
    </>
  );
}
