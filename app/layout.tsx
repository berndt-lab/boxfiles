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

/** Hairline column guides behind everything, aligned to the page column like a layout grid left visible. */
function PageGrid() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
      <div className="shell grid h-full grid-cols-2 sm:grid-cols-4">
        {[0, 1, 2, 3].map((column) => (
          <span
            key={column}
            className={`border-l border-white/[0.035] ${column === 1 ? "border-r sm:border-r-0" : ""} ${column > 1 ? "hidden sm:block" : ""} ${column === 3 ? "sm:border-r" : ""}`}
          />
        ))}
      </div>
    </div>
  )
}
