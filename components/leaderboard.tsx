import { LeaderboardTabs } from "@/components/leaderboard-tabs"
import { Panel } from "@/components/ui"
import { topPlayers, type Board, type LeaderboardEntry } from "@/lib/leaderboard"

const BOARDS: Board[] = ["overall", "difficulty", "completions"]

/** Everyone who signed in and stayed on the board: by gamerscore, by difficulty, and by games finished. */
export async function Leaderboard({ me }: { me?: string }) {
  let results: (LeaderboardEntry[] | null)[]
  try {
    results = await Promise.all(BOARDS.map((board) => topPlayers(board)))
  } catch {
    return (
      <Panel title="Leaderboards">
        <p className="px-5 py-6 text-sm text-muted">The leaderboards are unavailable right now. Try again in a minute.</p>
      </Panel>
    )
  }
  // Null means no storage is configured, so there is nothing to show.
  if (results[0] === null) return null
  const boards = Object.fromEntries(BOARDS.map((board, index) => [board, results[index] ?? []])) as Record<Board, LeaderboardEntry[]>
  return <LeaderboardTabs boards={boards} me={me} />
}
