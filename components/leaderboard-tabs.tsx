"use client"

import Link from "next/link"
import { useState } from "react"
import { Avatar, Gs, Meter } from "@/components/ui"
import { formatGs, formatPct } from "@/lib/format"
import type { Board, LeaderboardEntry } from "@/lib/leaderboard"

const columns = "grid-cols-[1.75rem_minmax(0,1fr)_auto] sm:grid-cols-[2rem_minmax(0,1fr)_7rem_12rem]"

const tabs: { board: Board; label: string; value: string; note: string }[] = [
  { board: "overall", label: "Overall", value: "Gamerscore", note: "Ranked by total gamerscore." },
  {
    board: "difficulty",
    label: "Difficulty",
    value: "Score",
    note: "Gamerscore weighted by rarity across each player's recent and biggest games: ultra rare counts 5×, very rare 3×, rare 2×, uncommon 1.5×.",
  },
  { board: "completions", label: "Completions", value: "100% games", note: "Ranked by games with every achievement unlocked." },
]

export function LeaderboardTabs({ boards, me }: { boards: Record<Board, LeaderboardEntry[]>; me?: string }) {
  const [board, setBoard] = useState<Board>("overall")
  const tab = tabs.find((item) => item.board === board) ?? tabs[0]
  const players = boards[board]
  return (
    <section className="material light-strip relative overflow-hidden rounded-[20px] border border-line">
      <header className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3 sm:px-5">
        <div role="tablist" aria-label="Leaderboards" className="flex flex-wrap rounded-full border border-line bg-background p-0.5">
          {tabs.map((item) => (
            <button
              key={item.board}
              type="button"
              role="tab"
              aria-selected={item.board === board}
              onClick={() => setBoard(item.board)}
              className={`rounded-full px-3.5 py-1.5 text-sm transition-colors duration-200 sm:py-1 ${
                item.board === board ? "bg-foreground text-background" : "text-muted hover:text-foreground"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <p className="label-mono ml-auto text-faint">
          {players.length} {players.length === 1 ? "player" : "players"}
        </p>
      </header>
      <p className="border-b border-line px-4 py-2.5 text-xs text-faint sm:px-5">{tab.note}</p>

      {players.length === 0 ? (
        <p className="px-5 py-8 text-sm text-muted">
          {board === "difficulty"
            ? "No difficulty scores yet. Scores appear after a player opens their dashboard."
            : "Nobody is on this board yet. Sign in with Xbox to take first place."}
        </p>
      ) : (
        <>
          <div className={`label-mono hidden ${columns} items-center gap-4 border-b border-line px-5 py-2.5 text-faint sm:grid`} aria-hidden>
            <span>#</span>
            <span>Player</span>
            <span className="text-right">{tab.value}</span>
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
                    className={`group grid ${columns} items-center gap-x-4 gap-y-2 px-4 py-4 transition-colors duration-300 hover:bg-white/[0.03] sm:px-5 ${
                      mine ? "ambient-row" : ""
                    }`}
                  >
                    <span className={`label-mono tabular-nums ${index < 3 ? "text-foreground" : "text-faint"}`}>
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="flex min-w-0 items-center gap-3">
                      <Avatar name={player.gamertag} src={player.avatar} size="md" />
                      <span className="min-w-0">
                        <span className="block truncate font-display text-lg font-semibold tracking-[-0.03em] transition-colors group-hover:text-white">
                          {player.gamertag}
                          {mine && <span className="ml-2 text-xs font-normal text-ambient">You</span>}
                        </span>
                        <span className="label-mono block truncate text-faint">{subline(board, player)}</span>
                      </span>
                    </span>
                    <span className="text-right font-display text-xl font-semibold tracking-[-0.03em] tabular-nums">
                      {board === "overall" ? (
                        <Gs value={formatGs(player.gamerscore)} />
                      ) : board === "difficulty" ? (
                        formatGs(player.difficulty ?? 0)
                      ) : (
                        formatGs(player.completed ?? 0)
                      )}
                    </span>
                    <span className="col-span-2 col-start-2 flex items-center gap-3 sm:col-span-1 sm:col-start-auto">
                      <Meter value={completion} className="flex-1" />
                      <span className="label-mono w-10 text-right tabular-nums text-muted">{formatPct(completion)}</span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ol>
        </>
      )}
    </section>
  )
}

function subline(board: Board, player: LeaderboardEntry) {
  if (board === "difficulty") return `${player.ultra ?? 0} ultra rare · ${formatGs(player.gamerscore)}G`
  if (board === "completions") return `of ${player.games} ${player.games === 1 ? "game" : "games"}`
  return `${player.games} ${player.games === 1 ? "game" : "games"}`
}
