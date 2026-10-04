import { SampleQuestion } from "@/components/sample-question";
import { WaitlistForm } from "@/components/waitlist-form";

const levels = [
  {
    name: "NS4",
    detail: "Les quatre filières du bac haïtien.",
    tracks: ["SES", "SVT", "LLA", "SMP"],
  },
  {
    name: "9e année fondamentale",
    detail: "Le programme de l'examen officiel de 9e AF.",
    tracks: [],
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

const steps = [
  { title: "Choisis ta section", body: "Sélectionne ton niveau et la filière que tu prépares." },
  { title: "Joue à des quiz", body: "Teste tes connaissances avec des questions ciblées." },
  {
    title: "Suis ta progression",
    body: "Gagne des points, des badges et grimpe dans le classement.",
  },
];

export default function Home() {
  return (
    <main className="flex-1">
      <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 pb-20 pt-10 sm:px-8 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:pb-28 lg:pt-16">
        <div>
          <h1 className="font-display text-[clamp(3rem,9vw,5.75rem)] font-extrabold leading-[0.95] tracking-[-0.03em] text-brand">
            Apprendre,
            <br />
            Réviser,
            <br />
            Réussir.
          </h1>
          <p className="mt-7 max-w-md text-lg leading-relaxed text-ink/75">
            Examplay est l&apos;app qui te prépare aux examens d&apos;État haïtiens, en NS4 et en
            9e année fondamentale. Bientôt sur vos écrans.
          </p>
          <div className="mt-8">
            <WaitlistForm id="email-hero" />
          </div>
        </div>
        <SampleQuestion />
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-6 border-t border-ink/10 px-5 py-16 sm:px-8 lg:grid-cols-[1fr_2fr] lg:gap-12 lg:py-24">
        <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Notre mission : ta réussite aux examens d&apos;État
        </h2>
        <div className="max-w-2xl space-y-4 text-lg leading-relaxed text-ink/75">
          <p>
            Examplay a été conçu par des étudiants, pour des étudiants. Notre objectif est simple :
            transformer les longues heures de révision en une expérience motivante et interactive.
          </p>
          <p>
            Nous croyons qu&apos;apprendre peut être amusant. C&apos;est pourquoi nous avons créé
            une plateforme de quiz, adaptée aux élèves de la 9e AF et aux séries du Nouveau
            Secondaire 4, pour t&apos;aider à maîtriser tes matières et à aborder l&apos;examen avec
            confiance.
          </p>
        </div>
      </section>

      <section className="bg-brand-soft">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[1fr_2fr] lg:py-24">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Pour quels examens&nbsp;?
          </h2>
          <dl className="divide-y divide-ink/10 border-y border-ink/10">
            {levels.map((level) => (
              <div
                key={level.name}
                className="flex flex-col gap-3 py-6 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <dt className="font-display text-2xl font-semibold">{level.name}</dt>
                  <dd className="mt-1 text-ink/70">{level.detail}</dd>
                </div>
                {level.tracks.length > 0 && (
                  <ul className="flex flex-wrap gap-2">
                    {level.tracks.map((track) => (
                      <li
                        key={track}
                        className="rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-brand"
                      >
                        {track}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 pt-16 sm:px-8 lg:pt-24">
        <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Comment ça marche ?
        </h2>
        <ol className="mt-10 grid gap-10 md:grid-cols-3">
          {steps.map((step, i) => (
            <li key={step.title}>
              <span className="font-display text-5xl font-extrabold text-brand">{i + 1}</span>
              <h3 className="mt-3 font-display text-xl font-semibold">{step.title}</h3>
              <p className="mt-2 leading-relaxed text-ink/70">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 lg:py-24">
        <h2 className="max-w-xl font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Ce que tu trouveras dans l&apos;app
        </h2>
        <ul className="mt-10 grid gap-x-12 gap-y-10 sm:grid-cols-2">
          {features.map((feature) => (
            <li key={feature.title} className="border-t-2 border-brand pt-5">
              <h3 className="font-display text-xl font-semibold">{feature.title}</h3>
              <p className="mt-2 max-w-md leading-relaxed text-ink/70">{feature.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section id="inscription" className="on-brand scroll-mt-8 bg-brand text-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-16 sm:px-8 lg:flex-row lg:items-end lg:justify-between lg:py-20">
          <div>
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Sois prévenu dès la sortie
            </h2>
            <p className="mt-3 max-w-md leading-relaxed text-white/80">
              Laisse ton e-mail. Tu recevras un seul message, le jour où l&apos;app est disponible.
            </p>
          </div>
          <WaitlistForm id="email-footer" />
        </div>
      </section>
    </main>
  );
}
