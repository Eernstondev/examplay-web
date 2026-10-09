import { SampleQuestion } from "@/components/sample-question";
import Link from "next/link";
import { AdSlot } from "@/components/ad-slot";
import { ns4Tracks } from "@/lib/levels";

const steps = [
  { title: "Choisis ta section", body: "Sélectionne ton niveau et la filière que tu prépares." },
  { title: "Joue à des quiz", body: "Teste tes connaissances avec des questions ciblées." },
  {
    title: "Suis ta progression",
    body: "Gagne des points, des badges et grimpe dans le classement.",
  },
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

const container = "mx-auto w-full max-w-6xl px-5 sm:px-8";
const cta =
  "btn-sun flex h-13 items-center justify-center rounded-xl px-10 text-base font-bold sm:h-14 sm:text-lg";
const h2 = "font-display text-[clamp(1.75rem,6vw,2.75rem)] font-bold leading-[1.1] tracking-tight";

export default function Home() {
  return (
    <main className="flex-1">
      {/* Hero : la carte de question déborde sous le bloc bleu sur mobile */}
      <section className="rounded-b-[2rem] bg-brand text-white sm:mx-4 sm:rounded-[2.5rem] lg:mx-6">
        <div
          className={`${container} grid gap-8 pt-6 sm:gap-10 sm:pt-14 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-14 lg:py-20`}
        >
          <div>
            <h1 className="font-display text-[clamp(2.125rem,10.5vw,5.75rem)] font-extrabold leading-[0.95] tracking-[-0.03em]">
              Apprendre,
              <br />
              Réviser,
              <br />
              Réussir.
            </h1>
            <p className="mt-3 max-w-md leading-relaxed text-white/85 sm:mt-5 sm:text-lg">
              L&apos;app qui te prépare aux examens d&apos;État haïtiens, en NS4 et en 9e année
              fondamentale.
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:mt-7 sm:flex-row sm:items-center sm:gap-6">
              <Link href="/commencer" className={cta}>
                Commencer
              </Link>
              <Link
                href="/connexion"
                className="py-2 text-center font-semibold underline underline-offset-4 sm:text-left"
              >
                J&apos;ai déjà un compte
              </Link>
            </div>
          </div>
          <div className="relative z-10 -mb-16 lg:mb-0">
            <SampleQuestion />
          </div>
        </div>
      </section>

      <section className={`${container} pb-16 pt-32 sm:pb-20 lg:py-28`}>
        <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr] lg:gap-14">
          <h2 className={h2}>Conçu par des étudiants, pour des étudiants.</h2>
          <div className="max-w-xl space-y-4 text-[1.0625rem] leading-relaxed text-ink/75 sm:text-lg">
            <p>
              Notre mission : ta réussite aux examens d&apos;État. On transforme les longues heures
              de révision en une expérience motivante et interactive.
            </p>
            <p>
              Nous croyons qu&apos;apprendre peut être amusant. Examplay est une plateforme de quiz
              adaptée aux élèves de la 9e AF et aux séries du Nouveau Secondaire 4, pour
              t&apos;aider à maîtriser tes matières et à aborder l&apos;examen avec confiance.
            </p>
          </div>
        </div>
      </section>

      <section className={`${container} pb-16 sm:pb-20 lg:pb-28`}>
        <h2 className={h2}>Pour quels examens&nbsp;?</h2>
        <div className="mt-7 grid gap-4 lg:mt-10 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-3xl bg-brand-soft p-6 sm:p-8">
            <h3 className="font-display text-3xl font-bold">NS4</h3>
            <p className="mt-1 text-ink/70">Les quatre filières du bac haïtien.</p>
            <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
              {ns4Tracks.map((track) => (
                <li key={track.code} className="flex items-center gap-3 rounded-2xl bg-surface p-3">
                  <span className="grid h-11 w-14 shrink-0 place-items-center rounded-xl bg-brand text-sm font-bold text-white">
                    {track.code}
                  </span>
                  <span className="text-sm font-medium leading-snug">{track.name}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col justify-between gap-8 rounded-3xl bg-navy p-6 text-white sm:p-8">
            <h3 className="font-display text-3xl font-bold leading-tight">
              9e année
              <br />
              fondamentale
            </h3>
            <p className="text-white/75">Le programme de l&apos;examen officiel de 9e AF.</p>
          </div>
        </div>
      </section>

      <AdSlot placement="home" className={`${container} pb-16 sm:pb-20`} />

      <section className="bg-brand-soft">
        <div className={`${container} py-16 sm:py-20 lg:py-28`}>
          <h2 className={h2}>Comment ça marche&nbsp;?</h2>
          <ol className="mt-8 grid gap-0 md:mt-12 md:grid-cols-3 md:gap-8">
            {steps.map((step, i) => (
              <li
                key={step.title}
                className="relative flex gap-4 pb-8 last:pb-0 md:block md:pb-0"
              >
                {/* Trait qui relie les étapes : vertical sur mobile, horizontal sur desktop */}
                {i < steps.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="absolute bottom-0 left-6 top-12 w-0.5 -translate-x-1/2 bg-brand/25 md:bottom-auto md:left-16 md:right-[-2rem] md:top-6 md:h-0.5 md:w-auto md:translate-x-0"
                  />
                )}
                <span className="relative grid size-12 shrink-0 place-items-center rounded-full bg-brand font-display text-xl font-bold text-white">
                  {i + 1}
                </span>
                <div className="md:mt-5">
                  <h3 className="font-display text-xl font-semibold">{step.title}</h3>
                  <p className="mt-1.5 leading-relaxed text-ink/70">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className={`${container} py-16 sm:py-20 lg:py-28`}>
        <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr] lg:gap-14">
          <h2 className={`${h2} lg:sticky lg:top-8 lg:self-start`}>
            Ce que tu trouveras dans l&apos;app
          </h2>
          <ul className="divide-y divide-ink/10 border-y border-ink/10">
            {features.map((feature) => (
              <li key={feature.title} className="py-6 sm:py-7">
                <h3 className="font-display text-xl font-semibold sm:text-2xl">{feature.title}</h3>
                <p className="mt-2 max-w-lg leading-relaxed text-ink/70">{feature.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-brand text-white sm:mx-4 sm:rounded-[2.5rem] lg:mx-6">
        <div
          className={`${container} flex flex-col gap-7 py-14 sm:py-16 lg:flex-row lg:items-center lg:justify-between lg:gap-14 lg:py-20`}
        >
          <div className="max-w-md">
            <h2 className={h2}>Prêt à réviser ?</h2>
            <p className="mt-3 text-[1.0625rem] leading-relaxed text-white/85">
              Choisis ta section, crée ton compte et retrouve ton tableau de bord.
            </p>
          </div>
          <Link href="/commencer" className={cta}>
            Commencer
          </Link>
        </div>
      </section>
    </main>
  );
}
