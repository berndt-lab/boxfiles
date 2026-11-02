import Link from "next/link"
import { Suspense } from "react"
import { Avatar, Gs, Meter, Panel } from "@/components/ui"
import { XboxSetup } from "@/components/xbox-setup"
import { formatGs, formatPct, formatRarity, rarityColor, rarityTier, tally } from "@/lib/format"
import { listProfiles } from "@/lib/profile"
import { currentSession } from "@/lib/xbox"
import { signInMessage } from "@/lib/xbox-auth"

const columns = "grid-cols-[1.75rem_minmax(0,1fr)_auto] sm:grid-cols-[2rem_minmax(0,1fr)_6.5rem_10rem_minmax(0,15rem)]"

export default function Home({ searchParams }: PageProps<"/">) {
  const players = listProfiles()
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

      <Panel
        className="mt-12"
        title="Leaderboard"
        aside={<span className="text-xs text-faint">{players.length} players, ranked by gamerscore</span>}
      >
        <div
          className={`hidden ${columns} items-center gap-4 border-b border-line px-4 py-2 text-xs text-faint sm:grid`}
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
                  className={`group grid ${columns} items-center gap-x-4 gap-y-2 px-4 py-3.5 transition-colors duration-150 hover:bg-white/[0.025]`}
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
    </main>
  )
}

async function SignInStatus({ searchParams }: Pick<PageProps<"/">, "searchParams">) {
  const { signin } = await searchParams
  const problem = signInMessage(typeof signin === "string" ? signin : undefined)
  const session = await currentSession()
  if (session && !problem) return null
  return (
    <div className="mt-8 space-y-3">
      {problem && (
        <p role="alert" className="max-w-xl rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          {problem}
        </p>
      )}
      {!session && <XboxSetup />}
    </div>
  )
}
