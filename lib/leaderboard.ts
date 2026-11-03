import { cacheLife, cacheTag } from "next/cache"
import { isCompleted, rarityTier, tally, type Profile, type RarityTone } from "@/lib/format"
import { cleanSocials, type Socials } from "@/lib/socials"
import type { RecentUnlock } from "@/lib/xbox-map"

// Upstash Redis over its REST API: one sorted set per board ranks xuids, a hash holds what each row shows.
const SCORES = "lb:gamerscore"
const PLAYERS = "lb:players"
const HIDDEN = "lb:hidden"
const TAGS = "lb:tags"
const SOCIALS = "lb:socials"
const VIEWS = "lb:views"
export const LEADERBOARD_TAG = "leaderboard"

const BOARDS = { overall: SCORES, difficulty: "lb:difficulty", completions: "lb:completed" } as const
export type Board = keyof typeof BOARDS

/** Difficulty weights by rarity tier: an ultra rare unlock is worth five times its gamerscore. */
export const DIFFICULTY_WEIGHTS: Record<RarityTone, number> = { ultra: 5, very: 3, rare: 2, uncommon: 1.5, common: 1 }

export type LeaderboardEntry = {
  xuid: string
  gamertag: string
  classicTag?: string
  avatar?: string
  gamerscore: number
  earned: number
  total: number
  games: number
  /** Games at 100%. */
  completed?: number
  /** Gamerscore weighted by rarity across the latest 1,000 unlocks. */
  difficulty?: number
  /** Unlocks under 5% of players, within those same unlocks. */
  ultra?: number
  updatedAt: string
}

function storage() {
  const url = (process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL)?.trim()
  const token = (process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN)?.trim()
  return url && token ? { url: url.replace(/\/$/, ""), token } : null
}

export function leaderboardReady() {
  return storage() !== null
}

async function redis(commands: (string | number)[][]): Promise<unknown[]> {
  const config = storage()
  if (!config) throw new Error("Leaderboard storage is not configured.")
  const response = await fetch(`${config.url}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${config.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(commands),
  })
  if (!response.ok) throw new Error(`Leaderboard storage failed (${response.status}).`)
  const rows = (await response.json()) as { result?: unknown; error?: string }[]
  return rows.map((row) => {
    if (row.error) throw new Error(row.error)
    return row.result
  })
}

function parseEntry(row: unknown): LeaderboardEntry | null {
  if (typeof row !== "string") return null
  try {
    return JSON.parse(row) as LeaderboardEntry
  } catch {
    return null
  }
}

/** Null when no storage is configured. */
export async function topPlayers(board: Board = "overall", limit = 50): Promise<LeaderboardEntry[] | null> {
  "use cache"
  cacheLife("minutes")
  cacheTag(LEADERBOARD_TAG)
  if (!storage()) return null
  const [ids] = await redis([["ZREVRANGE", BOARDS[board], 0, limit - 1]])
  const xuids = Array.isArray(ids) ? ids.filter((id): id is string => typeof id === "string") : []
  if (xuids.length === 0) return []
  const [rows] = await redis([["HMGET", PLAYERS, ...xuids]])
  return (Array.isArray(rows) ? rows : []).flatMap((row) => {
    const entry = parseEntry(row)
    return entry ? [entry] : []
  })
}

/** Public card data for a gamertag, so shared links show something to signed-out visitors. */
export async function entryByTag(tag: string): Promise<LeaderboardEntry | null> {
  "use cache"
  cacheLife("minutes")
  cacheTag(LEADERBOARD_TAG)
  if (!storage()) return null
  const [xuid] = await redis([["HGET", TAGS, tag.trim().toLowerCase()]])
  if (typeof xuid !== "string") return null
  const [row] = await redis([["HGET", PLAYERS, xuid]])
  return parseEntry(row)
}

export async function rankOf(xuid: string): Promise<{ rank: number; total: number } | null> {
  if (!storage()) return null
  const [rank, total] = await redis([
    ["ZREVRANK", SCORES, xuid],
    ["ZCARD", SCORES],
  ])
  return typeof rank === "number" && typeof total === "number" ? { rank: rank + 1, total } : null
}

export function difficultyOf(unlocks: RecentUnlock[]) {
  let difficulty = 0
  let ultra = 0
  for (const { achievement } of unlocks) {
    const tone = achievement.rarity == null ? "common" : rarityTier(achievement.rarity).tone
    difficulty += achievement.score * DIFFICULTY_WEIGHTS[tone]
    if (tone === "ultra") ultra += 1
  }
  return { difficulty: Math.round(difficulty), ultra }
}

/** `unlocks` adds the difficulty score; without it, the stored score is kept. */
export function entryFromProfile(profile: Profile, unlocks?: RecentUnlock[] | null): LeaderboardEntry | null {
  if (!profile.xuid) return null
  const stats = tally(profile.games)
  return {
    ...(unlocks ? difficultyOf(unlocks) : {}),
    completed: profile.games.filter(isCompleted).length,
    xuid: profile.xuid,
    gamertag: profile.gamertag,
    classicTag: profile.classicTag,
    avatar: profile.avatar,
    gamerscore: profile.gamerscore ?? stats.earned,
    earned: stats.earned,
    total: stats.total,
    games: profile.games.length,
    updatedAt: new Date().toISOString(),
  }
}

/** Adds or refreshes a signed-in player's row, unless they chose to leave the board. */
export async function saveEntry(entry: LeaderboardEntry) {
  if (!storage()) return
  const [hidden, previous] = await redis([
    ["SISMEMBER", HIDDEN, entry.xuid],
    ["HGET", PLAYERS, entry.xuid],
  ])
  if (hidden === 1) return
  const old = parseEntry(previous)
  const row: LeaderboardEntry = {
    ...entry,
    difficulty: entry.difficulty ?? old?.difficulty,
    ultra: entry.ultra ?? old?.ultra,
  }
  const tags = [row.gamertag, row.classicTag].filter((tag): tag is string => Boolean(tag))
  await redis([
    ["ZADD", BOARDS.overall, row.gamerscore, row.xuid],
    ["ZADD", BOARDS.completions, row.completed ?? 0, row.xuid],
    ...(row.difficulty != null ? [["ZADD", BOARDS.difficulty, row.difficulty, row.xuid]] : []),
    ["HSET", PLAYERS, row.xuid, JSON.stringify(row)],
    ...tags.map((tag) => ["HSET", TAGS, tag.toLowerCase(), row.xuid]),
  ])
}

export async function isHidden(xuid: string) {
  if (!storage()) return false
  const [hidden] = await redis([["SISMEMBER", HIDDEN, xuid]])
  return hidden === 1
}

export async function leaveBoard(xuid: string) {
  const [row] = await redis([["HGET", PLAYERS, xuid]])
  const entry = parseEntry(row)
  const tags = [entry?.gamertag, entry?.classicTag].filter((tag): tag is string => Boolean(tag))
  await redis([
    ["SADD", HIDDEN, xuid],
    ...Object.values(BOARDS).map((key) => ["ZREM", key, xuid]),
    ["HDEL", PLAYERS, xuid],
    ...tags.map((tag) => ["HDEL", TAGS, tag.toLowerCase()]),
  ])
}

export async function joinBoard(entry: LeaderboardEntry) {
  await redis([["SREM", HIDDEN, entry.xuid]])
  await saveEntry(entry)
}

/** Counts a visit to someone's profile. Owners viewing themselves aren't counted by the caller. */
export async function countView(xuid: string) {
  if (!storage()) return
  await redis([["HINCRBY", VIEWS, xuid, 1]])
}

export async function viewsOf(xuid: string): Promise<number | null> {
  if (!storage()) return null
  const [views] = await redis([["HGET", VIEWS, xuid]])
  return Number(views ?? 0) || 0
}

export async function socialsOf(xuid: string): Promise<Socials> {
  if (!storage()) return {}
  const [row] = await redis([["HGET", SOCIALS, xuid]])
  if (typeof row !== "string") return {}
  try {
    return cleanSocials(JSON.parse(row) as Record<string, unknown>)
  } catch {
    return {}
  }
}

export async function saveSocials(xuid: string, socials: Socials) {
  await redis([Object.keys(socials).length > 0 ? ["HSET", SOCIALS, xuid, JSON.stringify(socials)] : ["HDEL", SOCIALS, xuid]])
}
