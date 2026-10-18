import "@fontsource-variable/archivo/wdth.css";
import Link from "next/link";
import { AdSlot } from "@/components/ad-slot";
import { SampleQuestion } from "@/components/sample-question";
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

const container = "mx-auto w-full max-w-6xl px-5 sm:px-8";
const h2 = "home-display text-[clamp(2.25rem,7vw,3.75rem)] leading-[0.95]";
const cta = "btn-ink inline-flex h-13 items-center justify-center rounded-md px-8 text-base font-bold sm:h-14 sm:text-lg";

export default async function Home() {
  const t = await getT();
  return (
    <main className="home flex-1">
      {/* La page de cahier : lignes bleues, marge rouge, copie corrigée au stylo */}
      <section className="notebook relative border-b border-[var(--rule)]">
        <div className={`${container} relative grid gap-10 pt-[var(--line)] pb-[calc(var(--line)*2)] lg:grid-cols-[1.1fr_1fr] lg:items-start lg:gap-16 lg:pt-[calc(var(--line)*2)] lg:pb-[calc(var(--line)*3)]`}>
          <span aria-hidden="true" className="margin-rule -left-0 hidden lg:block xl:-left-6" />
          <div>
            <h1 className="home-display text-[clamp(3.25rem,13vw,7rem)] leading-[0.9]">
              {t("Révise avec les vraies questions d'examen.")}
            </h1>
            <p className="mt-[var(--line)] max-w-md text-lg leading-[var(--line)] text-ink/80">
              {t("Des quiz corrigés, tirés des annales officielles, pour la 9e année fondamentale et les quatre séries du NS4. Gratuit.")}
            </p>
            <div className="mt-[var(--line)] flex flex-wrap items-center gap-x-7 gap-y-3">
              <Link href="/commencer" className={cta}>
                {t("Commencer")}
              </Link>
              <Link href="/connexion" className="font-semibold underline underline-offset-4">
                {t("J'ai déjà un compte")}
              </Link>
            </div>
          </div>
          <SampleQuestion />
        </div>
      </section>

      {/* Les examens : chaque ligne mène directement à l'inscription */}
      <section className={`${container} py-20 lg:py-28`}>
        <h2 className={h2}>{t("Pour quels examens ?")}</h2>
        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_2fr] lg:gap-16">
          <p className="max-w-sm leading-relaxed text-ink/75">
            {t("Choisis ton examen : tu arrives directement sur la création de ton compte, avec les matières de ta section.")}
          </p>
          <div>
            <h3 className="font-semibold text-ink/65">{t("9e année fondamentale")}</h3>
            <ul className="mt-2 border-t-2 border-ink">
              <ExamRow href="/inscription?niveau=9e" code="9e AF" name={t("Le programme de l'examen officiel de 9e AF.")} />
            </ul>
            <h3 className="mt-10 font-semibold text-ink/65">{t("Nouveau Secondaire 4, quatre séries")}</h3>
            <ul className="mt-2 border-t-2 border-ink">
              {ns4Tracks.map((track) => (
                <ExamRow key={track.slug} href={`/inscription?niveau=${track.slug}`} code={track.code} name={t(track.name)} />
              ))}
            </ul>
          </div>
        </div>
      </section>

      <AdSlot placement="home" className={`${container} pb-20`} />

      {/* Une vraie suite d'étapes : numérotées comme les questions d'une copie */}
      <section className="border-y border-[var(--rule)] bg-brand-soft">
        <div className={`${container} py-20 lg:py-24`}>
          <h2 className={h2}>{t("Comment ça marche ?")}</h2>
          <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-12">
            {steps.map((step, i) => (
              <li key={step.title} className="grid grid-cols-[2.5rem_1fr] gap-x-3">
                <span aria-hidden="true" className="home-display text-pen text-4xl leading-none">
                  {i + 1}.
                </span>
                <div>
                  <h3 className="text-xl font-bold">{t(step.title)}</h3>
                  <p className="mt-1.5 leading-relaxed text-ink/75">{t(step.body)}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className={`${container} py-20 lg:py-28`}>
        <h2 className={`${h2} max-w-2xl`}>{t("Ce que tu trouveras dans l'app")}</h2>
        <dl className="mt-12 grid gap-x-16 gap-y-10 md:grid-cols-2">
          {features.map((feature) => (
            <div key={feature.title} className="border-t border-ink/20 pt-5">
              <dt className="text-xl font-bold">{t(feature.title)}</dt>
              <dd className="mt-2 max-w-md leading-relaxed text-ink/75">{t(feature.body)}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="bg-brand text-white">
        <div className={`${container} grid gap-8 py-20 lg:grid-cols-[1.4fr_1fr] lg:items-end lg:py-24`}>
          <div>
            <h2 className={h2}>{t("Conçu par des étudiants haïtiens, pour des étudiants.")}</h2>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/85">
              {t("Notre mission : ta réussite aux examens d'État. On transforme les longues heures de révision en une expérience motivante et interactive.")}
            </p>
          </div>
          <div className="lg:justify-self-end">
            <Link
              href="/commencer"
              className="inline-flex h-14 items-center justify-center rounded-md bg-white px-9 text-lg font-bold text-brand shadow-[0_4px_0_0_rgba(0,0,0,0.25)] transition-transform active:translate-y-[3px] active:shadow-[0_1px_0_0_rgba(0,0,0,0.25)]"
            >
              {t("Créer mon compte")}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function ExamRow({ href, code, name }: { href: string; code: string; name: string }) {
  return (
    <li className="border-b border-ink/20">
      <Link href={href} className="group grid grid-cols-[6.5rem_1fr] items-baseline gap-4 py-4 sm:grid-cols-[8rem_1fr]">
        <span className="home-display text-4xl leading-none sm:text-5xl">{code}</span>
        <span className="text-lg leading-snug text-ink/80 group-hover:underline group-hover:underline-offset-4">{name}</span>
      </Link>
    </li>
  );
}
