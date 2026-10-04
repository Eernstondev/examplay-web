import type { ReactNode } from "react";
import { PageShell } from "@/components/page-shell";

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <PageShell title={title}>
      <div className="legal max-w-3xl">{children}</div>
    </PageShell>
  );
}
