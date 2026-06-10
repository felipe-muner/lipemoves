import type { Metadata, Viewport } from "next"
import { Outfit } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { Providers } from "@/components/providers"


const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL("https://lipemoves.com"),
  title: "Lipe Moves \u2014 Yoga, Movement & Breathwork",
  description:
    "A video platform for yoga, mobility, acrobatics and breathwork. Subscribe and practice anywhere, anytime.",
  openGraph: {
    title: "Lipe Moves \u2014 Yoga, Movement & Breathwork",
    description:
      "Yoga, mobility, acrobatics and breathwork videos to practice at your own pace.",
    type: "website",
    locale: "en_US",
  },
  alternates: {
    canonical: "https://lipemoves.com",
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Lipe CRM",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
}

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={outfit.variable}>
      <body className="antialiased">
        <Providers>
          {children}
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}
