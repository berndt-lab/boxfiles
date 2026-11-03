import Link from "next/link"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import { AmbientControl } from "@/components/ambient-control"
import { SearchBox } from "@/components/search-box"
import { SignInLink } from "@/components/xbox-setup"
import { REFRESH_COOKIE, SESSION_COOKIE } from "@/lib/session"
import { currentSession } from "@/lib/xbox"
import { authConfigured } from "@/lib/xbox-auth"

async function lookupGamertag(formData: FormData) {
  "use server"
  const tag = String(formData.get("gamertag") ?? "").trim()
  if (!tag) redirect("/")
  redirect(`/u/${encodeURIComponent(tag)}`)
}

async function signOut() {
  "use server"
  const store = await cookies()
  store.delete(SESSION_COOKIE)
  store.delete(REFRESH_COOKIE)
  redirect("/")
}

export function SiteHeader() {
  return (
    <header className="light-strip light-strip-bottom sticky top-0 z-20 border-b border-line bg-background/60 backdrop-blur-2xl backdrop-saturate-150">
      <div className="shell flex h-16 items-center gap-3">
        <Link href="/" className="group flex shrink-0 items-center gap-2.5" aria-label="boxfiles home">
          <LogoMark />
          <span className="hidden font-display text-lg font-semibold tracking-[-0.04em] sm:inline">boxfiles</span>
          <span className="label-mono hidden rounded-full border border-line px-1.5 py-0.5 text-[10px] text-muted md:inline">Alpha</span>
        </Link>

        <SearchBox action={lookupGamertag} />

        <AmbientControl />
        <Suspense fallback={<span className="h-9 w-20 shrink-0" aria-hidden />}>
          <Account />
        </Suspense>
      </div>
    </header>
  )
}

async function Account() {
  const session = await currentSession()
  if (!session) return authConfigured() ? <SignInLink size="sm" /> : null
  return (
    <div className="flex shrink-0 items-center gap-1">
      <Link
        href={`/u/${encodeURIComponent(session.gamertag)}`}
        className="hidden h-9 max-w-40 items-center rounded-full border border-line px-3.5 font-mono sm:flex text-[13px] text-muted transition-colors hover:border-line-strong hover:text-foreground"
      >
        <span className="truncate">{session.gamertag}</span>
      </Link>
      <form action={signOut}>
        <button
          type="submit"
          className="label-mono h-9 rounded-full px-2 text-faint transition-colors hover:text-foreground sm:px-3"
        >
          Sign out
        </button>
      </form>
    </div>
  )
}

function LogoMark() {
  return (
    <span className="grid size-7 place-items-center rounded-lg bg-foreground text-background transition-transform duration-300 group-hover:rotate-[-6deg]">
      <svg viewBox="0 0 32 32" className="size-4" aria-hidden>
        <g fill="none" stroke="currentColor" strokeWidth="4.5">
          <path d="M12.25 6v19.75" />
          <circle cx="17.5" cy="18.75" r="4.75" />
        </g>
      </svg>
    </span>
  )
}
