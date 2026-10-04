import type { ReactNode } from "react";

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-14 sm:px-8 sm:py-20">
      <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">{title}</h1>
      <div className="legal mt-10">{children}</div>
    </main>
  );
}
