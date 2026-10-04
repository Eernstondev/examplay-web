import type { Metadata, Viewport } from "next";
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/instrument-sans";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { FooterGate } from "@/components/footer-gate";
import { SiteFooter } from "@/components/site-footer";
import { site } from "@/lib/site";

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

export const viewport: Viewport = { themeColor: "#1746A2", viewportFit: "cover" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <SiteHeader />
        {children}
        <FooterGate>
          <SiteFooter />
        </FooterGate>
      </body>
    </html>
  );
}
