import Link from "next/link"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import { AmbientControl } from "@/components/ambient-control"
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
    <header className="light-strip light-strip-bottom sticky top-0 z-20 border-b border-line bg-background/70 backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
        <Link href="/" className="group flex shrink-0 items-center gap-2" aria-label="boxfiles home">
          <LogoMark />
          <span className="hidden font-display text-[17px] font-semibold tracking-tight sm:inline">boxfiles</span>
        </Link>

        <form action={lookupGamertag} className="ml-auto flex min-w-0 flex-1 justify-end sm:max-w-sm">
          <label className="group relative flex h-9 w-full items-center rounded-full border border-line bg-card pl-3 pr-1 transition-[border-color,box-shadow] duration-200 focus-within:border-ambient/50 focus-within:shadow-[0_0_18px_rgb(var(--ambient)/0.25)]">
            <SearchIcon />
            <span className="sr-only">Gamertag</span>
            <input
              name="gamertag"
              required
              placeholder="Search a gamertag"
              autoCapitalize="none"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              className="h-full min-w-0 flex-1 bg-transparent px-2 text-sm text-foreground placeholder:text-faint focus:outline-none"
            />
            <button
              type="submit"
              className="h-7 shrink-0 rounded-full bg-foreground px-3 text-xs font-medium text-background transition-[opacity,transform] duration-150 hover:opacity-90 active:scale-95"
            >
              View
            </button>
          </label>
        </form>

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
  if (!session) return authConfigured() ? <SignInLink compact /> : null
  return (
    <div className="flex shrink-0 items-center gap-1">
      <Link
        href={`/u/${encodeURIComponent(session.gamertag)}`}
        className="flex h-9 max-w-40 items-center rounded-full border border-line px-3.5 text-sm text-muted transition-colors hover:border-line-strong hover:text-foreground"
      >
        <span className="truncate">{session.gamertag}</span>
      </Link>
      <form action={signOut}>
        <button
          type="submit"
          className="h-9 rounded-full px-3 text-sm text-faint transition-colors hover:bg-raised hover:text-foreground"
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

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 shrink-0 text-faint transition-colors group-focus-within:text-muted" aria-hidden>
      <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="m16 16 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
