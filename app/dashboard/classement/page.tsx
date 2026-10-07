import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdSlot } from "@/components/ad-slot";
import { SubHeader } from "@/components/app/ui";
import { getAccount, getLeaderboard } from "@/lib/data";

export const metadata: Metadata = { title: "Classement" };

// Or : top 5 %, Argent : top 20 %, Bronze : top 50 % (sur au moins 100 places), comme dans l'app.
function medal(rank: number, total: number) {
  const p = rank / Math.max(total, 100);
  if (p <= 0.05) return { label: "Or", className: "bg-[#D4A017] text-white" };
  if (p <= 0.2) return { label: "Argent", className: "bg-[#94A3B8] text-white" };
  if (p <= 0.5) return { label: "Bronze", className: "bg-[#B45F2B] text-white" };
  return null;
}

export default async function Page() {
  const account = await getAccount();
  if (!account) redirect("/connexion");

  const board = await getLeaderboard(100);
  const group = account.level === "9e" ? "9e AF" : "NS4";

  return (
    <>
      <SubHeader title={`Classement · ${account.department}`} />
      <p className="text-ink/70">
        Élèves de {group} de ton département. 10 points par bonne réponse, 30 par duel gagné.
      </p>

      {board.me && (
        <section className="mt-5 flex items-center justify-between gap-4 rounded-3xl bg-brand p-5 text-white">
          <div>
            <p className="text-sm font-semibold text-white/75">Ta place</p>
            <p className="font-display text-4xl font-extrabold leading-none">
              {board.me.rank}
              <span className="text-lg font-semibold text-white/70"> / {board.total}</span>
            </p>
          </div>
          <p className="font-display text-2xl font-bold">{board.me.points} pts</p>
        </section>
      )}

      {board.rows.length ? (
        <ol className="mt-5 grid gap-2">
          {board.rows.map((p) => {
            const m = medal(p.rank, board.total);
            return (
              <li
                key={p.id}
                className={`flex items-center gap-3 rounded-2xl p-3 ${
                  p.me ? "bg-white ring-2 ring-brand" : "bg-white ring-1 ring-ink/10"
                }`}
              >
                <span className="w-9 shrink-0 text-center font-display text-lg font-bold tabular-nums">{p.rank}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">
                    {p.name}
                    {p.me && <span className="ml-2 text-sm font-bold text-brand">Toi</span>}
                  </p>
                </div>
                {m && (
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${m.className}`}>{m.label}</span>
                )}
                <span className="shrink-0 font-semibold tabular-nums">{p.points} pts</span>
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="mt-8 text-center text-ink/70">Le classement n&apos;a pas pu être chargé.</p>
      )}

      <AdSlot
        placement="classement"
        target={{ department: account.department, level: account.level }}
        className="mt-7"
      />
    </>
  );
}
