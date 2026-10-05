import type { LevelId } from "@/lib/content";

export type Path = { field: string; examples: string };
export type Place = { name: string; detail: string };
export type Orientation = { intro: string; paths: Path[]; places: Place[] };

// Contenu indicatif : à faire valider avant publication (filières et établissements).
export const orientation: Partial<Record<LevelId, Orientation>> = {
  "ns4-svt": {
    intro:
      "La série SVT ouvre surtout sur les métiers de la santé, du vivant et de l'environnement.",
    paths: [
      { field: "Santé", examples: "Médecine, pharmacie, odontologie, sciences infirmières, laboratoire médical" },
      { field: "Agriculture et élevage", examples: "Agronomie, médecine vétérinaire, ressources naturelles" },
      { field: "Sciences du vivant", examples: "Biologie, biochimie, environnement, nutrition" },
      { field: "Enseignement", examples: "Professeur de sciences naturelles au secondaire" },
    ],
    places: [
      { name: "UEH, Faculté de Médecine et de Pharmacie (FMP)", detail: "Médecine, pharmacie, technologie médicale" },
      { name: "UEH, Faculté d'Odontologie (FO)", detail: "Chirurgie dentaire" },
      { name: "UEH, Faculté d'Agronomie et de Médecine Vétérinaire (FAMV)", detail: "Agronomie, médecine vétérinaire" },
      { name: "Université Notre-Dame d'Haïti (UNDH)", detail: "Médecine, sciences infirmières" },
      { name: "Université Quisqueya (UniQ)", detail: "Sciences de la santé, agriculture et environnement" },
      { name: "Écoles nationales d'infirmières", detail: "Sciences infirmières" },
    ],
  },
  "ns4-smp": {
    intro:
      "La série SMP prépare aux études d'ingénierie, d'informatique et de sciences exactes.",
    paths: [
      { field: "Ingénierie", examples: "Génie civil, électromécanique, électronique, industriel" },
      { field: "Architecture et topographie", examples: "Architecture, urbanisme, topographie" },
      { field: "Informatique", examples: "Développement logiciel, réseaux, télécommunications" },
      { field: "Sciences exactes", examples: "Mathématiques, physique, chimie, statistique" },
      { field: "Enseignement", examples: "Professeur de mathématiques ou de physique au secondaire" },
    ],
    places: [
      { name: "UEH, Faculté des Sciences (FDS)", detail: "Génie civil, électromécanique, électronique, architecture, topographie" },
      { name: "UEH, École Normale Supérieure (ENS)", detail: "Mathématiques, physique, formation des enseignants" },
      { name: "Université Quisqueya (UniQ)", detail: "Sciences, génie et architecture" },
      { name: "École Supérieure d'Infotronique d'Haïti (ESIH)", detail: "Informatique, télécommunications, gestion" },
      { name: "CTPEA", detail: "Statistique, planification, économie appliquée" },
    ],
  },
  "ns4-ses": {
    intro:
      "La série SES mène aux études d'économie, de gestion, de droit et de sciences sociales.",
    paths: [
      { field: "Économie et finance", examples: "Sciences économiques, banque, statistique, planification" },
      { field: "Gestion", examples: "Administration, comptabilité, marketing, entrepreneuriat" },
      { field: "Droit et politique", examples: "Sciences juridiques, sciences politiques, relations internationales" },
      { field: "Sciences sociales", examples: "Sociologie, anthropologie, travail social, communication" },
    ],
    places: [
      { name: "UEH, Faculté de Droit et des Sciences Économiques (FDSE)", detail: "Droit, sciences économiques" },
      { name: "UEH, INAGHEI", detail: "Administration, gestion, sciences politiques, relations internationales" },
      { name: "UEH, Faculté des Sciences Humaines (FASCH)", detail: "Sociologie, psychologie, travail social, communication sociale" },
      { name: "UEH, Faculté d'Ethnologie (FE)", detail: "Anthropologie, sociologie, psychologie" },
      { name: "CTPEA", detail: "Statistique, planification, économie appliquée" },
      { name: "Université Quisqueya (UniQ)", detail: "Sciences économiques et administratives" },
    ],
  },
  "ns4-lla": {
    intro:
      "La série LLA ouvre sur les lettres, les langues, la communication, le droit et les arts.",
    paths: [
      { field: "Lettres et langues", examples: "Lettres modernes, linguistique, traduction, interprétariat" },
      { field: "Communication", examples: "Journalisme, communication sociale, relations publiques" },
      { field: "Droit et sciences humaines", examples: "Sciences juridiques, philosophie, psychologie, histoire" },
      { field: "Arts", examples: "Musique, arts plastiques, théâtre, danse" },
      { field: "Enseignement", examples: "Professeur de lettres, de langues ou de philosophie" },
    ],
    places: [
      { name: "UEH, Faculté de Linguistique Appliquée (FLA)", detail: "Linguistique, langues, traduction" },
      { name: "UEH, École Normale Supérieure (ENS)", detail: "Lettres, philosophie, langues vivantes, sciences sociales" },
      { name: "UEH, Faculté des Sciences Humaines (FASCH)", detail: "Communication sociale, psychologie, travail social" },
      { name: "UEH, Faculté de Droit et des Sciences Économiques (FDSE)", detail: "Droit" },
      { name: "École Nationale des Arts (ENARTS)", detail: "Musique, arts plastiques, théâtre, danse" },
      { name: "Université Quisqueya (UniQ)", detail: "Sciences de l'éducation, sciences juridiques et politiques" },
    ],
  },
};
