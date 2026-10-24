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
      <header>
        <div className="mx-auto w-full max-w-5xl px-5 pt-12 pb-8 sm:px-8 sm:pt-20 sm:pb-12">
          <h1 className="max-w-3xl text-[clamp(2rem,5vw,3.25rem)] font-semibold leading-[1.1] tracking-[-0.03em]">
            {title}
          </h1>
          {lead && (
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink/60">
              {lead}
            </p>
          )}
        </div>
      </header>
      <div className="mx-auto w-full max-w-5xl px-5 pb-16 sm:px-8 sm:pb-24">{children}</div>
    </main>
  );
}

// Bloc titre à gauche, contenu à droite : la grille commune des pages institutionnelles.
// plain : sans le style de texte courant (listes de liens, cartes).
export function Block({ title, children, plain }: { title: string; children: ReactNode; plain?: boolean }) {
  return (
    <section className="grid gap-3 border-t border-ink/10 py-8 first:border-t-0 first:pt-0 sm:py-10 lg:grid-cols-[1fr_2fr] lg:gap-12">
      <h2 className="text-xl font-semibold leading-snug tracking-tight sm:text-2xl">
        {title}
      </h2>
      <div className={plain ? "max-w-2xl" : "prose-block max-w-2xl"}>{children}</div>
    </section>
  );
}
