import type { Metadata } from "next"
import { after } from "next/server"
import { Suspense } from "react"
import { ProfileView, type Filter } from "@/components/profile-view"
import { Avatar, Gs, Meter } from "@/components/ui"
import { SignInLink, XboxSetup } from "@/components/xbox-setup"
import { formatGs, formatPct, type Profile } from "@/lib/format"
import { entryByTag, entryFromProfile, saveEntry, type LeaderboardEntry } from "@/lib/leaderboard"
import { displayTag } from "@/lib/profile"
import { XboxError, currentSession, lookupXboxProfile } from "@/lib/xbox"
import { authConfigured } from "@/lib/xbox-auth"

type GamertagPage = PageProps<"/u/[gamertag]">

async function publicEntry(gamertag: string) {
  return entryByTag(displayTag(gamertag)).catch(() => null)
}

export async function generateMetadata({ params }: GamertagPage): Promise<Metadata> {
  const { gamertag } = await params
  const entry = await publicEntry(gamertag)
  if (!entry) return { title: displayTag(gamertag) || "Profile" }
  return {
    title: entry.gamertag,
    description: `${formatGs(entry.gamerscore)} gamerscore across ${entry.games} games on boxfiles.`,
  }
}

export default function Page({ params, searchParams }: GamertagPage) {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfilePage params={params} searchParams={searchParams} />
    </Suspense>
  )
}

async function ProfilePage({ params, searchParams }: GamertagPage) {
  const [{ gamertag }, query, session] = await Promise.all([params, searchParams, currentSession()])
  const label = displayTag(gamertag) || "that gamertag"

  if (!session) {
    const entry = await publicEntry(gamertag)
    return entry ? <PublicCard entry={entry} /> : <SignInNotice label={label} />
  }

  let profile: Profile | null = null
  let failure = ""
  try {
    profile = await lookupXboxProfile(label)
  } catch (error) {
    failure = error instanceof XboxError ? error.message : "Xbox lookup failed."
  }
  if (failure) {
    return <Notice title="Xbox lookup failed" body={failure} />
  }
  if (!profile) {
    return (
      <Notice
        title={<>No Xbox profile for “{label}”</>}
        body="Search uses the exact gamertag, including a #suffix when the name has one."
      />
    )
  }
  const entry = profile.xuid === session.xuid ? entryFromProfile(profile) : null
  if (entry) {
    // Viewing your own profile keeps your leaderboard row current.
    after(() => saveEntry(entry).catch(() => {}))
  }
  const game = typeof query.game === "string" ? query.game : undefined
  const show: Filter | undefined = query.show === "locked" ? "locked" : undefined
  return <ProfileView key={profile.gamertag} profile={profile} initialGame={game} initialFilter={show} />
}

/** What a shared link shows to someone who isn't signed in: the leaderboard card, plus a way in. */
function PublicCard({ entry }: { entry: LeaderboardEntry }) {
  const completion = entry.total === 0 ? 0 : entry.earned / entry.total
  return (
    <main className="mx-auto max-w-6xl px-4 pb-10 pt-14 sm:pt-20">
      <section className="relative max-w-2xl overflow-hidden rounded-3xl border border-line bg-card">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(520px 220px at 0% 0%, rgb(46 193 46 / 0.14), transparent 70%)" }}
          aria-hidden
        />
        <div className="relative flex items-center gap-4 p-5 sm:gap-5 sm:p-7">
          <Avatar name={entry.gamertag} src={entry.avatar} size="xl" />
          <div className="min-w-0">
            <h1 className="break-all font-display text-3xl font-semibold tracking-[-0.03em] sm:text-5xl">{entry.gamertag}</h1>
            <p className="mt-1 text-sm text-muted">On the boxfiles leaderboard</p>
          </div>
        </div>
        <dl className="relative grid grid-cols-3 gap-px border-t border-line bg-line">
          <div className="bg-card px-5 py-4">
            <dt className="text-xs text-muted">Gamerscore</dt>
            <dd className="mt-1 font-display text-2xl font-semibold">
              <Gs value={formatGs(entry.gamerscore)} />
            </dd>
          </div>
          <div className="bg-card px-5 py-4">
            <dt className="text-xs text-muted">Games</dt>
            <dd className="mt-1 font-display text-2xl font-semibold tabular-nums">{formatGs(entry.games)}</dd>
          </div>
          <div className="bg-card px-5 py-4">
            <dt className="text-xs text-muted">Completion</dt>
            <dd className="mt-1 font-display text-2xl font-semibold tabular-nums">{formatPct(completion)}</dd>
            <Meter value={completion} className="mt-2" color="var(--xbox)" />
          </div>
        </dl>
      </section>
      <div className="mt-8 flex max-w-2xl flex-wrap items-center gap-x-4 gap-y-3">
        {authConfigured() ? <SignInLink /> : null}
        <p className="max-w-sm text-sm text-muted">
          Sign in with Xbox to see every game and achievement, and how you compare.
        </p>
      </div>
    </main>
  )
}

function SignInNotice({ label }: { label: string }) {
  return (
    <Notice title={<>Sign in to see “{label}”</>} body="Live profiles come straight from Xbox Live, so you need to be signed in.">
      <div className="mt-6">
        <XboxSetup />
      </div>
    </Notice>
  )
}

function Notice({ title, body, children }: { title: React.ReactNode; body: string; children?: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-6xl px-4 pb-10 pt-14 sm:pt-20">
      <h1 className="max-w-2xl break-all font-display text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">{title}</h1>
      <p className="mt-3 max-w-xl text-muted">{body}</p>
      {children}
    </main>
  )
}

function ProfileSkeleton() {
  return (
    <main className="mx-auto max-w-6xl px-4 pb-10 pt-8 sm:pt-12" aria-label="Loading profile">
      <div className="rounded-3xl border border-line bg-card p-5 sm:p-7">
        <div className="flex items-center gap-5">
          <span className="size-14 animate-pulse rounded-full bg-raised sm:size-20" />
          <span className="flex-1 space-y-3">
            <span className="block h-8 w-48 animate-pulse rounded-full bg-raised" />
            <span className="block h-4 w-64 max-w-full animate-pulse rounded-full bg-raised/70" />
          </span>
        </div>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="h-64 animate-pulse rounded-2xl border border-line bg-card" />
        <div className="h-96 animate-pulse rounded-2xl border border-line bg-card" />
      </div>
    </main>
  )
}
