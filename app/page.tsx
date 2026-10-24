import Link from "next/link";
import { AdSlot } from "@/components/ad-slot";
import { getT } from "@/lib/i18n/server";
import { ns4Tracks } from "@/lib/levels";

const steps = [
  { title: "Choisis ta section", body: "Sélectionne ton niveau et la filière que tu prépares." },
  { title: "Joue à des quiz", body: "Teste tes connaissances avec des questions ciblées." },
  { title: "Suis ta progression", body: "Gagne des points, des badges et grimpe dans le classement." },
];

const features = [
  {
    title: "Trois façons de t'entraîner",
    body: "QCM, réponses courtes et rédactions : les mêmes formats que le jour de l'examen.",
  },
  {
    title: "Onze matières, des milliers de questions",
    body: "Le contenu suit le programme, chapitre par chapitre, pour réviser ce qui compte.",
  },
  {
    title: "Des duels entre élèves",
    body: "Défie un camarade sur une matière et compare vos résultats à la fin.",
  },
  {
    title: "Des scores qui ne trichent pas",
    body: "Chaque score est recalculé à partir de tes vraies réponses. Ce que tu vois, c'est ton niveau réel.",
  },
];

// Page mise en cache ; la zone admin la rafraîchit quand une publicité change.
export const revalidate = 300;

const container = "mx-auto w-full max-w-5xl px-5 sm:px-8";
const h2 = "text-[clamp(1.75rem,4vw,2.75rem)] font-semibold leading-[1.1] tracking-[-0.025em]";
const lead = "mx-auto mt-4 max-w-xl text-lg leading-relaxed text-ink/60";
const pill =
  "inline-flex h-12 items-center justify-center rounded-full bg-brand px-7 font-medium text-white transition-colors hover:bg-brand-dark";

export default async function Home() {
  const t = await getT();
  return (
    <main className="flex-1">
      <section className={`${container} pt-14 pb-20 text-center sm:pt-24 sm:pb-28`}>
        <p className="text-sm font-medium text-brand-fg">{t("9e année fondamentale")} · NS4</p>
        <h1 className="mx-auto mt-4 max-w-3xl text-[clamp(2.25rem,6vw,4.25rem)] font-semibold leading-[1.05] tracking-[-0.035em]">
          {t("Révise avec les vraies questions d'examen.")}
        </h1>
        <p className={`${lead} sm:text-xl`}>
          {t("Des quiz corrigés, tirés des annales officielles, pour la 9e année fondamentale et les quatre séries du NS4. Gratuit.")}
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-7">
          <Link href="/commencer" className={pill}>
            {t("Commencer")}
          </Link>
          <Link href="/connexion" className="font-medium text-brand-fg hover:underline hover:underline-offset-4">
            {t("J'ai déjà un compte")} ›
          </Link>
        </div>
      </section>

      <section className="bg-ink/[0.035] py-20 sm:py-28">
        <div className={`${container} text-center`}>
          <h2 className={h2}>{t("Pour quels examens ?")}</h2>
          <p className={lead}>
            {t("Choisis ton examen : tu arrives directement sur la création de ton compte, avec les matières de ta section.")}
          </p>
          <ul className="mt-12 grid grid-cols-2 gap-3 text-left lg:grid-cols-5">
            <ExamCard
              className="col-span-2 lg:col-span-1"
              href="/inscription?niveau=9e"
              code="9e AF"
              name={t("Le programme de l'examen officiel de 9e AF.")}
            />
            {ns4Tracks.map((track) => (
              <ExamCard key={track.slug} href={`/inscription?niveau=${track.slug}`} code={track.code} name={t(track.name)} />
            ))}
          </ul>
          <Link href="/matieres" className="mt-8 inline-block font-medium text-brand-fg hover:underline hover:underline-offset-4">
            {t("Voir les matières et des questions corrigées")} ›
          </Link>
        </div>
      </section>

      <section className={`${container} py-20 sm:py-28`}>
        <h2 className={`${h2} text-center`}>{t("Comment ça marche ?")}</h2>
        <ol className="mt-12 grid gap-10 sm:grid-cols-3 sm:gap-8">
          {steps.map((step, i) => (
            <li key={step.title} className="text-center">
              <span className="text-sm font-medium tabular-nums text-ink/40">0{i + 1}</span>
              <h3 className="mt-2 text-xl font-semibold tracking-tight">{t(step.title)}</h3>
              <p className="mx-auto mt-2 max-w-xs leading-relaxed text-ink/60">{t(step.body)}</p>
            </li>
          ))}
        </ol>
      </section>

      <AdSlot placement="home" className={`${container} pb-20`} />

      <section className={`${container} pb-20 sm:pb-28`}>
        <h2 className={`${h2} text-center`}>{t("Ce que tu trouveras dans l'app")}</h2>
        <ul className="mt-12 grid gap-3 sm:grid-cols-2">
          {features.map((feature) => (
            <li key={feature.title} className="rounded-3xl bg-ink/[0.035] p-7 sm:p-9">
              <h3 className="text-xl font-semibold tracking-tight">{t(feature.title)}</h3>
              <p className="mt-2 leading-relaxed text-ink/60">{t(feature.body)}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className={`${container} border-t border-ink/10 py-20 text-center sm:py-28`}>
        <h2 className={`${h2} mx-auto max-w-2xl`}>{t("Conçu par des étudiants haïtiens, pour des étudiants.")}</h2>
        <p className={lead}>
          {t("Notre mission : ta réussite aux examens d'État. On transforme les longues heures de révision en une expérience motivante et interactive.")}
        </p>
        <Link href="/commencer" className={`${pill} mt-9`}>
          {t("Créer mon compte")}
        </Link>
      </section>
    </main>
  );
}

function ExamCard({ href, code, name, className = "" }: { href: string; code: string; name: string; className?: string }) {
  return (
    <li className={className}>
      <Link
        href={href}
        className="flex h-full flex-col rounded-3xl bg-surface p-6 ring-1 ring-ink/5 transition-shadow hover:ring-brand/40"
      >
        <span className="text-2xl font-semibold tracking-tight">{code}</span>
        <span className="mt-2 text-sm leading-snug text-ink/60">{name}</span>
      </Link>
    </li>
  );
}
