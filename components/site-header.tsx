import Image from "next/image";
import Link from "next/link";
import { site } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
      <Link href="/" className="flex items-center gap-2.5">
        <Image src="/logo.png" alt="" width={40} height={40} priority className="rounded-[10px]" />
        <span className="font-display text-xl font-bold tracking-tight">{site.name}</span>
      </Link>
      <Link
        href="/#inscription"
        className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
      >
        Me prévenir au lancement
      </Link>
    </header>
  );
}
