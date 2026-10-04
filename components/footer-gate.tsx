"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

// Pas de pied de page dans le parcours de connexion ni dans l'espace élève.
const hidden = ["/commencer", "/connexion", "/inscription", "/dashboard"];

export function FooterGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (hidden.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return null;
  return children;
}
