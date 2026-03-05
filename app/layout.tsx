import type { Metadata } from "next"
import { Inter, DM_Serif_Display } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"


const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  variable: "--font-dm-serif",
  weight: "400",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL("https://lipemoves.com"),
  title: "Lipe Moves \u2014 Yoga, Movimento & Respira\u00e7\u00e3o",
  description:
    "Plataforma de v\u00eddeos de yoga, mobilidade, acrobacia e respira\u00e7\u00e3o. Assine e pratique onde e quando quiser.",
  openGraph: {
    title: "Lipe Moves \u2014 Yoga, Movimento & Respira\u00e7\u00e3o",
    description:
      "V\u00eddeos de yoga, mobilidade, acrobacia e respira\u00e7\u00e3o para voc\u00ea praticar no seu ritmo.",
    type: "website",
    locale: "pt_BR",
  },
  alternates: {
    canonical: "https://lipemoves.com",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${dmSerif.variable}`}>
      <body className="antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
