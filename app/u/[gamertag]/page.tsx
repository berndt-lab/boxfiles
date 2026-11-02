import type { Metadata } from "next"
import { after } from "next/server"
import { Suspense } from "react"
import { ProfileView, type Filter } from "@/components/profile-view"
import { Avatar, Meter } from "@/components/ui"
import { XboxAmbient } from "@/components/xbox-ambient"
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
  return (
    <>
      {entry && profile.color && <XboxAmbient color={profile.color} />}
      <ProfileView key={profile.gamertag} profile={profile} initialGame={game} initialFilter={show} />
    </>
  )
}

/** What a shared link shows to someone who isn't signed in: the leaderboard card, plus a way in. */
function PublicCard({ entry }: { entry: LeaderboardEntry }) {
  const completion = entry.total === 0 ? 0 : entry.earned / entry.total
  return (
    <main className="shell pt-8 sm:pt-12">
      <div className="label-mono flex items-center justify-between gap-4 border-b border-line pb-4 text-muted">
        <span className="flex items-center gap-2">
          <span className="ambient-glow size-1.5 rounded-full bg-ambient" aria-hidden />
          (Public card) On the boxfiles board
        </span>
        <span className="hidden sm:block">Xbox achievements</span>
      </div>
      <div className="mt-8 grid items-end gap-8 sm:mt-12 lg:grid-cols-12">
        <div className="flex min-w-0 items-end gap-4 sm:gap-6 lg:col-span-7">
          <Avatar name={entry.gamertag} src={entry.avatar} size="xl" />
          <h1 className="min-w-0 break-all font-display text-[clamp(2.5rem,7vw,6.5rem)] font-semibold leading-[0.9] tracking-[-0.055em]">
            {entry.gamertag}
          </h1>
        </div>
        <div className="lg:col-span-5 lg:text-right">
          <p className="label-mono text-muted">Gamerscore</p>
          <p className="mt-2 font-display text-[clamp(3.5rem,9vw,8rem)] font-semibold leading-[0.82] tracking-[-0.06em] tabular-nums">
            {formatGs(entry.gamerscore)}
            <span className="ambient-text ml-[0.04em] align-top text-[0.34em] tracking-normal">G</span>
          </p>
        </div>
      </div>
      <dl className="mt-10 grid grid-cols-2 border-t border-line sm:mt-14 sm:grid-cols-4">
        <div className="py-5 pr-4">
          <dt className="label-mono text-muted">Games</dt>
          <dd className="mt-2 font-display text-3xl font-semibold tabular-nums tracking-[-0.04em] sm:text-4xl">
            {formatGs(entry.games)}
          </dd>
        </div>
        <div className="border-l border-line py-5 pl-4 sm:pl-5">
          <dt className="label-mono text-muted">Completion</dt>
          <dd className="mt-2 font-display text-3xl font-semibold tabular-nums tracking-[-0.04em] sm:text-4xl">
            {formatPct(completion)}
          </dd>
          <Meter value={completion} className="mt-3 max-w-40" />
        </div>
      </dl>
      <div className="mt-16 grid items-end gap-8 border-t border-line pt-10 sm:grid-cols-12">
        <p className="display-em font-display text-4xl font-semibold leading-[0.95] tracking-[-0.045em] sm:col-span-7 sm:text-6xl">
          See every game, every unlock, and <em>how you compare</em>.
        </p>
        <div className="sm:col-span-5 sm:justify-self-end">{authConfigured() ? <SignInLink size="lg" /> : null}</div>
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
    <main className="shell pt-10 sm:pt-16">
      <h1 className="max-w-4xl break-all font-display text-5xl font-semibold leading-[0.92] tracking-[-0.05em] sm:text-7xl">
        {title}
      </h1>
      <p className="mt-5 max-w-xl text-lg text-muted">{body}</p>
      {children}
    </main>
  )
}

function ProfileSkeleton() {
  return (
    <main className="shell pb-10 pt-8 sm:pt-12" aria-label="Loading profile">
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
