import type { MetadataRoute } from "next";
import { PUBLIC_SUBJECTS } from "@/lib/content";
import { site } from "@/lib/site";

const pages = ["", "/matieres", "/a-propos", "/remerciements", "/collaborateurs", "/investisseurs", "/contact", "/commencer", "/confidentialite", "/conditions", "/suppression-compte"];

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...pages.map((path) => ({
      url: `${site.url}${path}`,
      changeFrequency: path === "" ? ("weekly" as const) : ("monthly" as const),
      priority: path === "" ? 1 : 0.6,
    })),
    ...PUBLIC_SUBJECTS.map((s) => ({
      url: `${site.url}/matieres/${s.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
