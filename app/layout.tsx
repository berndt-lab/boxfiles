import type { Metadata } from "next"
import { Bricolage_Grotesque, Geist, Geist_Mono, Instrument_Serif } from "next/font/google"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { AMBIENT_SCRIPT } from "@/lib/ambient"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  axes: ["opsz"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

const instrument = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
})

function siteUrl() {
  const redirect = process.env.XBOX_REDIRECT_URI?.trim()
  if (redirect) return new URL(redirect).origin
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim()
  return vercel ? `https://${vercel}` : "http://localhost:3000"
}

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "boxfiles",
    template: "%s · boxfiles",
  },
  description: "Know what to unlock next, out-score your friends, and show off your rarest Xbox achievements.",
  robots: { index: false, follow: false },
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The head script sets the viewer's ambient lighting on <html> before React hydrates.
    <html lang="en" className={`${geistSans.variable} ${bricolage.variable} ${geistMono.variable} ${instrument.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: AMBIENT_SCRIPT }} />
      </head>
      <body className="relative flex min-h-full flex-col bg-background font-sans text-foreground">
        <PageGrid />
        <SiteHeader />
        <div className="relative z-[1] flex-1">{children}</div>
        <SiteFooter />
      </body>
    </html>
  )
}

/** A fine square grid behind the top of every page, fading out toward the edges and as you scroll down. */
function PageGrid() {
  return <div className="square-grid pointer-events-none fixed inset-x-0 top-0 z-0 h-[560px]" aria-hidden />
}
