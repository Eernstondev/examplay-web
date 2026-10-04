import type { ReactNode } from "react";

export function PageShell({
  title,
  lead,
  children,
}: {
  title: string;
  lead: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-20 pt-10 sm:px-8 lg:pb-28 lg:pt-16">
      <header className="max-w-3xl">
        <h1 className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          {title}
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-ink/75">{lead}</p>
      </header>
      <div className="mt-14">{children}</div>
    </main>
  );
}

// Bloc titre à gauche, contenu à droite : la grille commune des pages institutionnelles.
export function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-4 border-t border-ink/10 py-10 lg:grid-cols-[1fr_2fr] lg:gap-12">
      <h2 className="font-display text-2xl font-semibold tracking-tight">{title}</h2>
      <div className="prose-block max-w-2xl">{children}</div>
    </section>
  );
}
