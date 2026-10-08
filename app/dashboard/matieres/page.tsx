import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdSlot } from "@/components/ad-slot";
import { ProgressBar, SubHeader } from "@/components/app/ui";
import { getSubjects } from "@/lib/content";
import { getAccount, getQuestionCounts, getResults } from "@/lib/data";
import { subjectProgress } from "@/lib/stats";

export const metadata: Metadata = { title: "Choisis une matière" };

const modes = [
  { id: "quiz", label: "Quiz", hint: "5 questions à choix multiples, avec correction après chaque réponse." },
  { id: "exam", label: "Simulation", hint: "Toutes les questions à choix multiples, sans correction avant la fin, comme le jour de l'examen." },
  { id: "short", label: "Réponse courte", hint: "Tu écris ta réponse, puis tu vois la correction." },
  { id: "essay", label: "Rédaction", hint: "Tu rédiges, puis tu compares avec le modèle." },
  { id: "flash", label: "Fiches", hint: "Des fiches à retourner : question d'un côté, réponse de l'autre." },
];

export default async function Page({ searchParams }: PageProps<"/dashboard/matieres">) {
  const account = await getAccount();
  if (!account) redirect("/connexion");

  const params = await searchParams;
  const mode = modes.find((m) => m.id === params.mode) ?? modes[0];
  const [counts, results] = await Promise.all([getQuestionCounts(), getResults()]);
  const subjects = getSubjects(account.level);

  return (
    <>
      <SubHeader title="Choisis une matière" />
      <nav aria-label="Mode de révision" className="-mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
        <ul className="flex w-max gap-2">
          {modes.map((m) => (
            <li key={m.id}>
              <Link
                href={`/dashboard/matieres?mode=${m.id}`}
                aria-current={m.id === mode.id ? "page" : undefined}
                className="grid h-11 place-items-center whitespace-nowrap rounded-full bg-surface px-4 text-sm font-bold text-ink/70 ring-1 ring-ink/10 aria-[current=page]:bg-brand aria-[current=page]:text-white aria-[current=page]:ring-0"
              >
                {m.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <p className="mt-3 text-sm leading-relaxed text-ink/70">{mode.hint}</p>

      <ul className="mt-5 grid gap-2.5 md:grid-cols-2">
        {subjects.map((s) => {
          const count = counts[s.id] ?? 0;
          const progress = subjectProgress(results, s.id);
          const href =
            mode.id === "exam"
              ? `/dashboard/quiz?subject=${s.id}&mode=exam`
              : `/dashboard/chapitres?subject=${s.id}&mode=${mode.id}`;
          const body = (
            <>
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-display text-lg font-semibold">
                  {s.name}
                  {s.heavy && <span className="ml-2 text-sm font-bold text-brand-fg">×2</span>}
                </span>
                {count > 0 && <span className="shrink-0 text-sm font-semibold text-ink/60">{progress}%</span>}
              </div>
              <span className="mt-0.5 block text-sm text-ink/60">
                {count ? `${count} questions disponibles` : "Bientôt disponible"}
              </span>
              {count > 0 && (
                <div className="mt-3">
                  <ProgressBar value={progress} />
                </div>
              )}
            </>
          );
          return (
            <li key={s.id}>
              {count ? (
                <Link
                  href={href}
                  className="block rounded-2xl bg-surface p-4 ring-1 ring-ink/10 transition-transform hover:ring-2 hover:ring-brand active:scale-[0.98]"
                >
                  {body}
                </Link>
              ) : (
                <div className="rounded-2xl bg-surface/60 p-4 ring-1 ring-ink/10">{body}</div>
              )}
            </li>
          );
        })}
      </ul>

      <AdSlot
        placement="matieres"
        target={{ department: account.department, level: account.level }}
        className="mt-7"
      />
    </>
  );
}
