import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-5 py-20 text-center">
      <p className="font-display text-[clamp(5rem,28vw,9rem)] font-extrabold leading-none text-brand">404</p>
      <h1 className="mt-2 font-display text-2xl font-bold tracking-tight">Page introuvable</h1>
      <p className="mt-2 max-w-md leading-relaxed text-ink/70">
        Cette page n&apos;existe pas ou a été déplacée.
      </p>
      <Link href="/" className="mt-7 grid h-13 w-full max-w-xs place-items-center rounded-xl bg-brand font-bold text-white hover:bg-brand-dark">
        Retour à l&apos;accueil
      </Link>
    </main>
  );
}
