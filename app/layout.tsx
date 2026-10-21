import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/instrument-sans";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { FooterGate } from "@/components/footer-gate";
import { SiteFooter } from "@/components/site-footer";
import { site, socials } from "@/lib/site";
import { I18nProvider } from "@/components/i18n-provider";
import { getLang } from "@/lib/i18n/server";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} : ${site.slogan}`, template: `%s | ${site.name}` },
  description: site.description,
  openGraph: {
    title: `${site.name} : ${site.slogan}`,
    description: site.description,
    siteName: site.name,
    locale: "fr_HT",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1746A2" },
    { media: "(prefers-color-scheme: dark)", color: "#0A1020" },
  ],
  viewportFit: "cover",
};

// Données structurées : aident Google à afficher « Examplay » comme nom du site,
// y compris pour les recherches « examplayedu ».
const jsonLd = JSON.stringify([
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.name,
    alternateName: ["examplayedu", "Examplay Edu", "examplayedu.com"],
    url: site.url,
    inLanguage: ["fr", "ht"],
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.name,
    url: site.url,
    logo: `${site.url}/icon-512.png`,
    email: site.email,
    sameAs: socials.map((s) => s.href),
  },
]);

// Applique le thème choisi avant le premier affichage (évite le flash clair).
const themeScript = `try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}`;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const lang = await getLang();
  return (
    <html lang={lang} className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      </head>
      <body className="flex min-h-full flex-col">
        <I18nProvider lang={lang}>
          <SiteHeader />
          {children}
          <FooterGate>
            <SiteFooter />
          </FooterGate>
        </I18nProvider>
        <Analytics />
      </body>
    </html>
  );
}
