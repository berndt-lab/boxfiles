import type { Metadata } from "next"
import Link from "next/link"
import { after } from "next/server"
import { Suspense } from "react"
import { ProfileView } from "@/components/profile-view"
import { Avatar } from "@/components/ui"
import { XboxSetup } from "@/components/xbox-setup"
import { formatGs, tally, type Profile } from "@/lib/format"
import { entryFromProfile, saveEntry } from "@/lib/leaderboard"
import { displayTag, findProfile, listProfiles } from "@/lib/profile"
import { XboxError, currentSession, lookupXboxProfile } from "@/lib/xbox"

type GamertagPage = { params: Promise<{ gamertag: string }> }

export function generateStaticParams() {
  return listProfiles().map((profile) => ({ gamertag: profile.gamertag }))
}

export async function generateMetadata({ params }: GamertagPage): Promise<Metadata> {
  const { gamertag } = await params
  const profile = findProfile(gamertag)
  if (!profile) return { title: displayTag(gamertag) || "Profile" }
  const stats = tally(profile.games)
  return {
    title: profile.gamertag,
    description: `${profile.gamertag} · ${formatGs(stats.earned)} gamerscore`,
  }
}

export default function Page({ params }: GamertagPage) {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfilePage params={params} />
    </Suspense>
  )
}

async function ProfilePage({ params }: GamertagPage) {
  const { gamertag } = await params
  const sample = findProfile(gamertag)
  if (sample) return <ProfileView key={sample.gamertag} profile={sample} />

  const label = displayTag(gamertag) || "that gamertag"
  const session = await currentSession()
  if (!session) {
    return (
      <Notice title={<>No sample profile for “{label}”</>} body="Sign in with Xbox to look up real gamertags, or open one of the sample players.">
        <div className="mt-6">
          <XboxSetup />
        </div>
        <SampleLinks />
      </Notice>
    )
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
      >
        <SampleLinks />
      </Notice>
    )
  }
  const entry = profile.xuid === session.xuid ? entryFromProfile(profile) : null
  if (entry) {
    // Viewing your own profile keeps your leaderboard row current.
    after(() => saveEntry(entry).catch(() => {}))
  }
  return <ProfileView key={profile.gamertag} profile={profile} />
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

function SampleLinks() {
  return (
    <div className="mt-8">
      <p className="text-sm text-muted">Sample players</p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {listProfiles().map((player) => (
          <li key={player.gamertag}>
            <Link
              href={`/u/${encodeURIComponent(player.gamertag)}`}
              className="flex items-center gap-2 rounded-full border border-line bg-card py-1 pl-1 pr-3.5 text-sm transition-colors hover:border-line-strong hover:bg-raised"
            >
              <Avatar name={player.gamertag} size="sm" />
              {player.gamertag}
            </Link>
          </li>
        ))}
      </ul>
    </div>
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
