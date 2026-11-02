import type { Metadata } from "next"
import { Bricolage_Grotesque, Geist } from "next/font/google"
import { SiteHeader } from "@/components/site-header"
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

export const metadata: Metadata = {
  title: {
    default: "xboxprofiles",
    template: "%s · xboxprofiles",
  },
  description: "Show off Xbox achievements, gamerscore, and rare unlocks.",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${bricolage.variable} h-full antialiased`}>
      <body className="relative flex min-h-full flex-col bg-background font-sans text-foreground">
        <SiteHeader />
        <div className="relative z-[1] flex-1">{children}</div>
        <footer className="relative z-[1] mt-16 border-t border-line">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-6 text-xs text-faint">
            <span>xboxprofiles</span>
            <span>Live data comes from Xbox Live when you sign in. Fan-made and independent of Microsoft.</span>
          </div>
        </footer>
      </body>
    </html>
  )
}
