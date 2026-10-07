import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

const pages = ["", "/a-propos", "/remerciements", "/collaborateurs", "/investisseurs", "/contact", "/commencer", "/confidentialite", "/conditions"];

export default function sitemap(): MetadataRoute.Sitemap {
  return pages.map((path) => ({
    url: `${site.url}${path}`,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.6,
  }));
}
