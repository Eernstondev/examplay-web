import type { ReactNode } from "react";

export function PageShell({
  title,
  lead,
  children,
}: {
  title: string;
  lead?: string;
  children: ReactNode;
}) {
  return (
    <main className="flex-1">
      <header className="rounded-b-[2rem] bg-brand-soft sm:mx-4 sm:rounded-[2.5rem] lg:mx-6">
        <div className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 sm:py-14 lg:py-20">
          <h1 className="max-w-3xl font-display text-[clamp(2rem,8vw,3.5rem)] font-bold leading-[1.05] tracking-tight">
            {title}
          </h1>
          {lead && (
            <p className="mt-4 max-w-2xl text-[1.0625rem] leading-relaxed text-ink/75 sm:mt-5 sm:text-lg">
              {lead}
            </p>
          )}
        </div>
      </header>
      <div className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 sm:py-14 lg:py-20">{children}</div>
    </main>
  );
}

// Bloc titre à gauche, contenu à droite : la grille commune des pages institutionnelles.
export function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-3 border-t border-ink/10 py-8 first:border-t-0 first:pt-0 sm:py-10 lg:grid-cols-[1fr_2fr] lg:gap-12">
      <h2 className="font-display text-[1.375rem] font-semibold leading-snug tracking-tight sm:text-2xl">
        {title}
      </h2>
      <div className="prose-block max-w-2xl">{children}</div>
    </section>
  );
}
