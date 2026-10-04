import type { ReactNode } from "react";

// Gabarit commun aux écrans du parcours : choix du niveau, connexion, inscription.
export function AuthShell({
  title,
  lead,
  wide,
  children,
}: {
  title: string;
  lead?: ReactNode;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <main className="flex-1 bg-brand-soft sm:mx-4 sm:mb-4 sm:rounded-[2.5rem] lg:mx-6 lg:mb-6">
      <div className={`mx-auto w-full px-5 py-10 sm:px-8 sm:py-16 ${wide ? "max-w-3xl" : "max-w-md"}`}>
        <h1 className="font-display text-[clamp(1.875rem,7.5vw,2.75rem)] font-bold leading-[1.08] tracking-tight">
          {title}
        </h1>
        {lead && <p className="mt-3 text-[1.0625rem] leading-relaxed text-ink/75">{lead}</p>}
        <div className="mt-7">{children}</div>
      </div>
    </main>
  );
}
