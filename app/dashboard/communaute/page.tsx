import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Community } from "@/components/app/community";
import { SubHeader } from "@/components/app/ui";
import { getSubjects } from "@/lib/content";
import { getAccount, getFinishedDuels, getLeaderboard, getQuestionCounts } from "@/lib/data";

export const metadata: Metadata = { title: "Communauté et duels" };

export default async function Page() {
  const account = await getAccount();
  if (!account) redirect("/connexion");

  const [counts, board, history] = await Promise.all([
    getQuestionCounts(),
    getLeaderboard(100),
    getFinishedDuels(account.id),
  ]);
  const subjects = getSubjects(account.level)
    .filter((s) => (counts[s.id] ?? 0) > 0)
    .map((s) => ({ value: s.id, label: s.name }));
  const points = Object.fromEntries(board.rows.map((r) => [r.id, { rank: r.rank, points: r.points }]));

  return (
    <>
      <SubHeader title="Communauté et duels" />
      <Community
        me={{ id: account.id, name: account.name, department: account.department, level: account.level }}
        subjects={subjects}
        points={points}
        history={history}
      />
    </>
  );
}
