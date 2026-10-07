import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

// Permet d'installer le site sur l'écran d'accueil du téléphone.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.name,
    short_name: site.name,
    description: site.description,
    lang: "fr",
    // /commencer renvoie un élève déjà connecté vers son tableau de bord.
    start_url: "/commencer",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#1746A2",
    icons: [
      { src: "/logo.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
