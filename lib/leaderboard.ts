import { cacheLife, cacheTag } from "next/cache"
import { tally, type Profile } from "@/lib/format"

// Upstash Redis over its REST API: a sorted set ranks xuids by gamerscore, a hash holds what each row shows.
const SCORES = "lb:gamerscore"
const PLAYERS = "lb:players"
const HIDDEN = "lb:hidden"
const TAGS = "lb:tags"
export const LEADERBOARD_TAG = "leaderboard"

export type LeaderboardEntry = {
  xuid: string
  gamertag: string
  classicTag?: string
  avatar?: string
  gamerscore: number
  earned: number
  total: number
  games: number
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
export async function topPlayers(limit = 50): Promise<LeaderboardEntry[] | null> {
  "use cache"
  cacheLife("minutes")
  cacheTag(LEADERBOARD_TAG)
  if (!storage()) return null
  const [ids] = await redis([["ZREVRANGE", SCORES, 0, limit - 1]])
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

export function entryFromProfile(profile: Profile): LeaderboardEntry | null {
  if (!profile.xuid) return null
  const stats = tally(profile.games)
  return {
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
  const [hidden] = await redis([["SISMEMBER", HIDDEN, entry.xuid]])
  if (hidden === 1) return
  const tags = [entry.gamertag, entry.classicTag].filter((tag): tag is string => Boolean(tag))
  await redis([
    ["ZADD", SCORES, entry.gamerscore, entry.xuid],
    ["HSET", PLAYERS, entry.xuid, JSON.stringify(entry)],
    ...tags.map((tag) => ["HSET", TAGS, tag.toLowerCase(), entry.xuid]),
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
    ["ZREM", SCORES, xuid],
    ["HDEL", PLAYERS, xuid],
    ...tags.map((tag) => ["HDEL", TAGS, tag.toLowerCase()]),
  ])
}

export async function joinBoard(entry: LeaderboardEntry) {
  await redis([["SREM", HIDDEN, entry.xuid]])
  await saveEntry(entry)
}
