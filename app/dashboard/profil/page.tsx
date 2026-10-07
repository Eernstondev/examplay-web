import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut } from "@/app/actions";
import { DeleteAccount } from "@/components/app/delete-account";
import { SubHeader } from "@/components/app/ui";
import { levelLabel } from "@/lib/content";
import { getAccount, getReferralCount } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Mon profil" };

type PublicProfile = {
  points: number;
  quizzes: number;
  perfect: number;
  active_days: number;
  subjects_done: number;
  duel_wins: number;
};

export default async function Page() {
  const account = await getAccount();
  if (!account) redirect("/connexion");

  const supabase = await createClient();
  const [{ data }, referrals] = await Promise.all([
    supabase.rpc("player_public_profile", { p_id: account.id }).maybeSingle(),
    getReferralCount(),
  ]);
  const stats = data as PublicProfile | null;

  const rows = [
    ["Points", stats?.points],
    ["Quiz terminés", stats?.quizzes],
    ["Quiz sans faute", stats?.perfect],
    ["Jours actifs", stats?.active_days],
    ["Matières travaillées", stats?.subjects_done],
    ["Duels gagnés", stats?.duel_wins],
  ] as const;

  return (
    <>
      <SubHeader title="Mon profil" />
      <section className="flex items-center gap-4 rounded-3xl bg-white p-5 ring-1 ring-ink/10">
        <span className="grid size-16 shrink-0 place-items-center rounded-full bg-brand font-display text-2xl font-bold text-white">
          {account.name.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="truncate font-display text-xl font-bold">{account.name}</p>
          <p className="truncate text-sm text-ink/60">{account.email}</p>
          <p className="mt-1 text-sm font-semibold">
            {levelLabel(account.level)} · {account.department}
          </p>
        </div>
      </section>
      <p className="mt-2 text-sm text-ink/60">
        Le nom, le niveau et le département sont fixés à l&apos;inscription.
      </p>

      <dl className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3">
        {rows.map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-white p-4 ring-1 ring-ink/10">
            <dt className="text-sm font-semibold text-ink/60">{label}</dt>
            <dd className="mt-1 font-display text-2xl font-bold">{Number(value ?? 0)}</dd>
          </div>
        ))}
      </dl>

      {account.referralCode && (
        <section className="mt-5 rounded-3xl bg-brand p-5 text-white">
          <p className="text-sm font-semibold text-white/75">Ton code de parrainage</p>
          <p className="mt-1 select-all font-display text-3xl font-extrabold tracking-wider">
            {account.referralCode}
          </p>
          <p className="mt-2 text-sm text-white/80">
            {referrals > 0
              ? `${referrals} ami${referrals > 1 ? "s" : ""} inscrit${referrals > 1 ? "s" : ""} avec ton code.`
              : "Partage-le : tes amis le saisissent dans l'app à l'inscription."}
          </p>
        </section>
      )}

      <Link
        href="/contribuer"
        className="mt-5 block rounded-3xl bg-white p-5 ring-1 ring-ink/10 transition-transform hover:ring-2 hover:ring-brand active:scale-[0.98]"
      >
        <span className="font-display text-lg font-semibold">Espace enseignants et experts</span>
        <span className="mt-1 block text-sm leading-relaxed text-ink/65">
          Tu es enseignant ou expert ? Demande l&apos;accès pour proposer des questions, des corrections et des cours.
        </span>
      </Link>

      <form action={signOut} className="mt-6">
        <button
          type="submit"
          className="h-13 w-full rounded-xl bg-white font-bold text-danger ring-1 ring-ink/15 sm:w-auto sm:px-8"
        >
          Se déconnecter
        </button>
      </form>

      <DeleteAccount />
    </>
  );
}
