export const site = {
  name: "Examplay",
  slogan: "Apprendre, Réviser, Réussir",
  description:
    "Examplay prépare les élèves haïtiens aux examens d'État : NS4 et 9e année fondamentale. Bientôt sur vos écrans.",
  email: "examplay.officiel@gmail.com",
  url: process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000",
} as const;
