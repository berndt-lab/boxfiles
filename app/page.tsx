import Link from "next/link"
import { updateTag } from "next/cache"
import { Suspense } from "react"
import { Avatar, Gs, Meter, Panel } from "@/components/ui"
import { XboxSetup } from "@/components/xbox-setup"
import { formatGs, formatPct, formatRarity, rarityColor, rarityTier, tally } from "@/lib/format"
import {
  LEADERBOARD_TAG,
  entryFromProfile,
  isHidden,
  joinBoard,
  leaderboardReady,
  leaveBoard,
  topPlayers,
  type LeaderboardEntry,
} from "@/lib/leaderboard"
import { listProfiles } from "@/lib/profile"
import { currentSession, lookupMyProfile } from "@/lib/xbox"
import { signInMessage } from "@/lib/xbox-auth"

const sampleColumns =
  "grid-cols-[1.75rem_minmax(0,1fr)_auto] sm:grid-cols-[2rem_minmax(0,1fr)_6.5rem_10rem_minmax(0,15rem)]"
const liveColumns = "grid-cols-[1.75rem_minmax(0,1fr)_auto] sm:grid-cols-[2rem_minmax(0,1fr)_6.5rem_12rem]"

async function leaveLeaderboard() {
  "use server"
  const session = await currentSession()
  if (!session) return
  await leaveBoard(session.xuid)
  updateTag(LEADERBOARD_TAG)
}

async function joinLeaderboard() {
  "use server"
  const profile = await lookupMyProfile().catch(() => null)
  const entry = profile ? entryFromProfile(profile) : null
  if (!entry) return
  await joinBoard(entry)
  updateTag(LEADERBOARD_TAG)
}

export default function Home({ searchParams }: PageProps<"/">) {
  return (
    <main className="mx-auto max-w-6xl px-4 pb-10 pt-14 sm:pt-20">
      <h1 className="max-w-2xl font-display text-4xl font-semibold tracking-[-0.03em] sm:text-6xl">
        Show off your achievements.
      </h1>
      <p className="mt-4 max-w-xl text-pretty text-muted sm:text-lg">
        Gamerscore, game completion, and how rare each unlock is. Sign in with Xbox to see yours and look up any
        gamertag.
      </p>

      <Suspense fallback={null}>
        <SignInStatus searchParams={searchParams} />
      </Suspense>

      <Leaderboard />
    </main>
  )
}

async function SignInStatus({ searchParams }: Pick<PageProps<"/">, "searchParams">) {
  const { signin } = await searchParams
  const problem = signInMessage(typeof signin === "string" ? signin : undefined)
  const session = await currentSession()
  const membership = session && leaderboardReady() ? <Membership xuid={session.xuid} gamertag={session.gamertag} /> : null
  if (session && !problem && !membership) return null
  return (
    <div className="mt-8 space-y-3">
      {problem && (
        <p role="alert" className="max-w-xl rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          {problem}
        </p>
      )}
      {session ? membership : <XboxSetup />}
    </div>
  )
}

async function Membership({ xuid, gamertag }: { xuid: string; gamertag: string }) {
  const hidden = await isHidden(xuid).catch(() => null)
  if (hidden === null) return null
  return (
    <form
      action={hidden ? joinLeaderboard : leaveLeaderboard}
      className="flex max-w-xl flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-card px-5 py-4 text-sm"
    >
      <span className="min-w-0 text-muted">
        {hidden ? (
          <>You&apos;re hidden from the leaderboard.</>
        ) : (
          <>
            You&apos;re on the leaderboard as <span className="text-foreground">{gamertag}</span>.
          </>
        )}
      </span>
      <button
        type="submit"
        className="h-8 shrink-0 rounded-full border border-line px-3.5 text-muted transition-colors hover:border-line-strong hover:text-foreground"
      >
        {hidden ? "Join leaderboard" : "Leave leaderboard"}
      </button>
    </form>
  )
}

async function Leaderboard() {
  let players: LeaderboardEntry[] | null
  try {
    players = await topPlayers()
  } catch {
    return (
      <Panel className="mt-12" title="Leaderboard">
        <p className="px-4 py-6 text-sm text-muted">The leaderboard is unavailable right now. Try again in a minute.</p>
      </Panel>
    )
  }
  return players ? <LiveBoard players={players} /> : <SampleBoard />
}

function LiveBoard({ players }: { players: LeaderboardEntry[] }) {
  return (
    <Panel
      className="mt-12"
      title="Leaderboard"
      aside={
        <span className="text-xs text-faint">
          {players.length} {players.length === 1 ? "player" : "players"}, ranked by gamerscore
        </span>
      }
    >
      {players.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted">Nobody is on the board yet. Sign in with Xbox to take first place.</p>
      ) : (
        <>
          <div
            className={`hidden ${liveColumns} items-center gap-4 border-b border-line px-4 py-2 text-xs text-faint sm:grid`}
            aria-hidden
          >
            <span>#</span>
            <span>Player</span>
            <span className="text-right">Gamerscore</span>
            <span>Completion</span>
          </div>
          <ol>
            {players.map((player, index) => {
              const completion = player.total === 0 ? 0 : player.earned / player.total
              return (
                <li key={player.xuid} className="border-b border-line last:border-b-0">
                  <Link
                    href={`/u/${encodeURIComponent(player.gamertag)}`}
                    className={`group grid ${liveColumns} items-center gap-x-4 gap-y-2 px-4 py-3.5 transition-colors duration-150 hover:bg-white/[0.025]`}
                  >
                    <span className="text-sm tabular-nums text-faint">{index + 1}</span>
                    <span className="flex min-w-0 items-center gap-3">
                      <Avatar name={player.gamertag} src={player.avatar} size="md" />
                      <span className="min-w-0">
                        <span className="block truncate font-medium transition-colors group-hover:text-white">
                          {player.gamertag}
                        </span>
                        <span className="block truncate text-sm text-muted">
                          {player.games} {player.games === 1 ? "game" : "games"}
                        </span>
                      </span>
                    </span>
                    <Gs value={formatGs(player.gamerscore)} className="text-right font-display text-lg font-semibold" />
                    <span className="col-span-2 col-start-2 flex items-center gap-3 sm:col-span-1 sm:col-start-auto">
                      <Meter value={completion} className="flex-1" />
                      <span className="w-9 text-right text-xs tabular-nums text-muted">{formatPct(completion)}</span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ol>
        </>
      )}
    </Panel>
  )
}

/** Shown only when no leaderboard storage is configured, such as local dev. */
function SampleBoard() {
  const players = listProfiles()
  return (
    <Panel
      className="mt-12"
      title="Sample players"
      aside={<span className="text-xs text-faint">Demo data, not real rankings</span>}
    >
      <div
        className={`hidden ${sampleColumns} items-center gap-4 border-b border-line px-4 py-2 text-xs text-faint sm:grid`}
        aria-hidden
      >
        <span>#</span>
        <span>Player</span>
        <span className="text-right">Gamerscore</span>
        <span>Completion</span>
        <span>Rarest unlock</span>
      </div>
      <ol>
        {players.map((profile, index) => {
          const stats = tally(profile.games)
          const tier = stats.rarest ? rarityTier(stats.rarest.rarity) : null
          return (
            <li key={profile.gamertag} className="border-b border-line last:border-b-0">
              <Link
                href={`/u/${encodeURIComponent(profile.gamertag)}`}
                className={`group grid ${sampleColumns} items-center gap-x-4 gap-y-2 px-4 py-3.5 transition-colors duration-150 hover:bg-white/[0.025]`}
              >
                <span className="text-sm tabular-nums text-faint">{index + 1}</span>
                <span className="flex min-w-0 items-center gap-3">
                  <Avatar name={profile.gamertag} size="md" />
                  <span className="min-w-0">
                    <span className="block truncate font-medium transition-colors group-hover:text-white">
                      {profile.gamertag}
                    </span>
                    <span className="block truncate text-sm text-muted">{profile.bio}</span>
                  </span>
                </span>
                <Gs value={formatGs(stats.earned)} className="text-right font-display text-lg font-semibold" />
                <span className="col-span-2 col-start-2 flex items-center gap-3 sm:col-span-1 sm:col-start-auto">
                  <Meter value={stats.completion} className="flex-1" />
                  <span className="w-9 text-right text-xs tabular-nums text-muted">{formatPct(stats.completion)}</span>
                </span>
                {stats.rarest && tier ? (
                  <span className="col-span-2 col-start-2 flex min-w-0 items-center gap-2 text-sm sm:col-span-1 sm:col-start-auto">
                    <span
                      className="size-1.5 shrink-0 rounded-full"
                      style={{ background: rarityColor[tier.tone], boxShadow: `0 0 8px ${rarityColor[tier.tone]}` }}
                      aria-hidden
                    />
                    <span className="truncate">{stats.rarest.name}</span>
                    <span className="shrink-0 text-xs tabular-nums" style={{ color: rarityColor[tier.tone] }}>
                      {formatRarity(stats.rarest.rarity)}
                    </span>
                  </span>
                ) : (
                  <span className="hidden text-sm text-faint sm:block">None yet</span>
                )}
              </Link>
            </li>
          )
        })}
      </ol>
    </Panel>
  )
}
