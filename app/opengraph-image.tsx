import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { site } from "@/lib/site";

// Image affichée quand le lien du site est partagé (WhatsApp, Facebook, etc.).
export const alt = `${site.name} : ${site.slogan}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const logo = await readFile(join(process.cwd(), "public/icon-512.png"));
  const src = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#1746A2",
          color: "#ffffff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <img src={src} width={96} height={96} alt="" style={{ borderRadius: 22 }} />
          <div style={{ fontSize: 48, fontWeight: 700 }}>{site.name}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 96, fontWeight: 800, lineHeight: 1.02 }}>
          <span>Apprendre,</span>
          <span>Réviser,</span>
          <span>Réussir.</span>
        </div>
        <div style={{ fontSize: 30, opacity: 0.85 }}>
          Prépare les examens d&apos;État haïtiens : NS4 et 9e année fondamentale.
        </div>
      </div>
    ),
    size,
  );
}
