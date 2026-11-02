import type { Metadata } from "next"
import { Bricolage_Grotesque, Geist } from "next/font/google"
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
    <html lang="en" className={`${geistSans.variable} ${bricolage.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: AMBIENT_SCRIPT }} />
      </head>
      <body className="relative flex min-h-full flex-col bg-background font-sans text-foreground">
        <SiteHeader />
        <div className="relative z-[1] flex-1">{children}</div>
        <footer className="relative z-[1] mt-16 border-t border-line">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-6 text-xs text-faint">
            <span>boxfiles</span>
            <span>Live data comes from Xbox Live when you sign in. Fan-made and independent of Microsoft.</span>
          </div>
        </footer>
      </body>
    </html>
  )
}
