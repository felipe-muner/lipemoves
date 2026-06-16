import { ImageResponse } from "next/og"
import { readFileSync } from "node:fs"
import { join } from "node:path"

// Branded casting card, generated at build time (black + lime, mirroring the
// /models hero) so the link preview matches the page.
export const runtime = "nodejs"
export const alt = "Be in our videos — apply to feature in Lipe Moves casting"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

const archivo = readFileSync(
  join(process.cwd(), "public/fonts/ArchivoBlack-Regular.ttf"),
)
const outfit = readFileSync(
  join(process.cwd(), "assets/fonts/Outfit-600.ttf"),
)

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          backgroundColor: "#0a0a0a",
          padding: "84px",
          fontFamily: "Outfit",
        }}
      >
        {/* eyebrow */}
        <div
          style={{
            display: "flex",
            fontSize: 28,
            letterSpacing: 12,
            color: "#39FF14",
            textTransform: "uppercase",
          }}
        >
          Casting · Apply
        </div>

        {/* headline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 28,
            fontFamily: "Archivo Black",
            fontSize: 132,
            lineHeight: 0.95,
            color: "#ffffff",
            textTransform: "uppercase",
          }}
        >
          <div style={{ display: "flex" }}>Be in our</div>
          <div style={{ display: "flex", color: "#39FF14" }}>videos.</div>
        </div>

        {/* subtitle */}
        <div
          style={{
            display: "flex",
            marginTop: 40,
            maxWidth: 940,
            fontSize: 36,
            lineHeight: 1.3,
            color: "rgba(255,255,255,0.68)",
          }}
        >
          Movers, yogis &amp; athletes — get featured in Lipe Moves shoots in
          Koh Phangan.
        </div>

        {/* wordmark */}
        <div
          style={{
            display: "flex",
            marginTop: 56,
            fontFamily: "Archivo Black",
            fontSize: 30,
            letterSpacing: 6,
            color: "#ffffff",
            textTransform: "uppercase",
          }}
        >
          lipemoves.com
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Archivo Black", data: archivo, weight: 400, style: "normal" },
        { name: "Outfit", data: outfit, weight: 600, style: "normal" },
      ],
    },
  )
}
