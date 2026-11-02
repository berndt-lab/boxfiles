import Link from "next/link"
import { Avatar, Gs, Meter, Panel } from "@/components/ui"
import { formatGs, formatPct } from "@/lib/format"
import { topPlayers, type LeaderboardEntry } from "@/lib/leaderboard"

const columns = "grid-cols-[1.75rem_minmax(0,1fr)_auto] sm:grid-cols-[2rem_minmax(0,1fr)_6.5rem_12rem]"

/** Everyone who signed in and stayed on the board, ranked by gamerscore. */
export async function Leaderboard({ me }: { me?: string }) {
  let players: LeaderboardEntry[] | null
  try {
    players = await topPlayers()
  } catch {
    return (
      <Panel title="Global leaderboard">
        <p className="px-4 py-6 text-sm text-muted">The leaderboard is unavailable right now. Try again in a minute.</p>
      </Panel>
    )
  }
  if (players === null) return null
  return (
    <Panel
      title="Global leaderboard"
      aside={
        <span className="text-xs text-faint">
          Top {players.length} {players.length === 1 ? "player" : "players"} on boxfiles
        </span>
      }
    >
      {players.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted">Nobody is on the board yet. Sign in with Xbox to take first place.</p>
      ) : (
        <>
          <div
            className={`hidden ${columns} items-center gap-4 border-b border-line px-4 py-2 text-xs text-faint sm:grid`}
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
              const mine = player.xuid === me
              return (
                <li key={player.xuid} className="border-b border-line last:border-b-0">
                  <Link
                    href={`/u/${encodeURIComponent(player.gamertag)}`}
                    className={`group grid ${columns} items-center gap-x-4 gap-y-2 px-4 py-3.5 transition-colors duration-150 hover:bg-white/[0.025] ${
                      mine ? "ambient-row" : ""
                    }`}
                  >
                    <span className={`text-sm tabular-nums ${index < 3 ? "text-foreground" : "text-faint"}`}>{index + 1}</span>
                    <span className="flex min-w-0 items-center gap-3">
                      <Avatar name={player.gamertag} src={player.avatar} size="md" />
                      <span className="min-w-0">
                        <span className="block truncate font-medium transition-colors group-hover:text-white">
                          {player.gamertag}
                          {mine && <span className="ml-2 text-xs font-normal text-ambient">You</span>}
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
