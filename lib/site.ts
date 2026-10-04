export const site = {
  name: "Examplay",
  slogan: "Apprendre, Réviser, Réussir",
  description:
    "Examplay prépare les élèves haïtiens aux examens d'État : NS4 et 9e année fondamentale. Bientôt sur vos écrans.",
  email: "examplay.officiel@gmail.com",
  whatsapp: "https://wa.me/message/3ZKPRYCMWKRSF1",
  url: process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000",
} as const;

export const socials = [
  { label: "Facebook", href: "https://www.facebook.com/share/1C4xJXYy6r/" },
  { label: "Instagram", href: "https://www.instagram.com/examplay_/" },
  { label: "TikTok", href: "https://www.tiktok.com/@examplayofficiel" },
] as const;

export const navLinks = [
  { label: "Accueil", href: "/" },
  { label: "À propos", href: "/a-propos" },
  { label: "Remerciements", href: "/remerciements" },
  { label: "Collaborateurs", href: "/collaborateurs" },
  { label: "Investisseurs", href: "/investisseurs" },
  { label: "Nous contacter", href: "/contact" },
] as const;
