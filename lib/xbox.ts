import { cookies } from "next/headers"
import { connection } from "next/server"
import { completionTier, type Achievement, type Game, type Profile } from "@/lib/format"
import { SESSION_COOKIE, unseal, type XboxSession } from "@/lib/session"
import {
  achievementsFrom,
  gamesFrom,
  peopleFrom,
  pickPerson,
  type RecentUnlock,
  type XboxPerson,
} from "@/lib/xbox-map"

const PEOPLE = "https://peoplehub.xboxlive.com/users/me/people"
const PROFILE = "https://profile.xboxlive.com/users"
const TITLES = "https://titlehub.xboxlive.com/users"
const ACHIEVEMENTS = "https://achievements.xboxlive.com/users"
const PEOPLE_DECORATION = "detail,preferredColor,presenceDetail"
const SETTINGS = [
  "Gamertag",
  "ModernGamertag",
  "UniqueModernGamertag",
  "GameDisplayPicRaw",
  "Gamerscore",
  "AccountTier",
  "XboxOneRep",
  "Bio",
  "Location",
  "TenureLevel",
].join(",")

export class XboxError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "XboxError"
  }
}

/** The signed-in Xbox account, or null. Reads cookies, so callers sit behind Suspense. */
export async function currentSession(): Promise<XboxSession | null> {
  const session = unseal<XboxSession>((await cookies()).get(SESSION_COOKIE)?.value)
  // Comparing against the clock only makes sense per request, so tell Next.js not to prerender past this point.
  await connection()
  return session && session.expiresAt > Date.now() ? session : null
}

async function requireSession() {
  const session = await currentSession()
  if (!session) throw new XboxError("Sign in with Xbox to load live profiles.")
  return session
}

// Per-viewer, best effort: the dashboard, profile, and achievement calls share answers for two minutes.
// Keys include the viewer's xuid, so one player's view never answers another's.
const CACHE_MS = 2 * 60 * 1000
const cache = new Map<string, { at: number; value: Promise<unknown> }>()

function xboxGet(session: XboxSession, url: string, contract: string): Promise<unknown> {
  const key = `${session.xuid} ${contract} ${url}`
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.value
  const value = xboxFetch(session, url, contract)
  cache.set(key, { at: Date.now(), value })
  value.catch(() => cache.delete(key))
  if (cache.size > 500) cache.delete(cache.keys().next().value ?? "")
  return value
}

async function xboxFetch(session: XboxSession, url: string, contract: string): Promise<unknown> {
  const response = await fetch(url, {
    headers: {
      Authorization: `XBL3.0 x=${session.uhs};${session.xsts}`,
      "x-xbl-contract-version": contract,
      Accept: "application/json",
      "Accept-Language": "en-US",
    },
    cache: "no-store",
  })
  if (response.status === 404) return null
  const body: unknown = await response.json().catch(() => null)
  if (response.ok) return body
  if (response.status === 401) throw new XboxError("Your Xbox sign-in expired. Sign in again.")
  if (response.status === 403) throw new XboxError("This player's Xbox privacy settings hide it.")
  if (response.status === 429) throw new XboxError("Xbox Live rate limit reached. Try again in a minute.")
  throw new XboxError(`Xbox lookup failed (${response.status}).`)
}

function expired(error: unknown) {
  return error instanceof XboxError && error.message.includes("expired")
}

/** Peoplehub has presence and followers; profile settings is the plainer fallback. */
async function personByXuid(session: XboxSession, xuid: string): Promise<XboxPerson | null> {
  const id = encodeURIComponent(xuid)
  try {
    const rich = peopleFrom(await xboxGet(session, `${PEOPLE}/xuids(${id})/decoration/${PEOPLE_DECORATION}`, "5"))
    if (rich[0]) return rich[0]
  } catch (error) {
    if (expired(error)) throw error
  }
  return peopleFrom(await xboxGet(session, `${PROFILE}/xuid(${id})/profile/settings?settings=${SETTINGS}`, "3"))[0] ?? null
}

type Found = { person: XboxPerson; rich: boolean }

/** Search and the exact-gamertag lookup run together; a search hit wins because it carries more detail. */
async function personByTag(session: XboxSession, tag: string): Promise<Found | null> {
  const [search, exact] = await Promise.allSettled([
    xboxGet(session, `${PEOPLE}/search/decoration/${PEOPLE_DECORATION}?q=${encodeURIComponent(tag)}&maxItems=25`, "5"),
    xboxGet(session, `${PROFILE}/gt(${encodeURIComponent(tag)})/profile/settings?settings=${SETTINGS}`, "3"),
  ])
  const hit = search.status === "fulfilled" ? pickPerson(peopleFrom(search.value), tag) : null
  if (hit) return { person: hit, rich: true }
  const match = exact.status === "fulfilled" ? pickPerson(peopleFrom(exact.value), tag) : null
  if (match) return { person: match, rich: false }
  for (const result of [search, exact]) {
    if (result.status === "rejected" && expired(result.reason)) throw result.reason
  }
  if (exact.status === "rejected") throw exact.reason
  return null
}

function titlesUrl(xuid: string) {
  return `${TITLES}/xuid(${encodeURIComponent(xuid)})/titles/titlehistory/decoration/achievement,image?maxItems=500`
}

/** Profile details and title history only need the xuid, so they load side by side. */
async function profileFor(session: XboxSession, xuid: string, known: Found | null): Promise<Profile | null> {
  const details = known?.rich
    ? Promise.resolve(known.person)
    : personByXuid(session, xuid)
        .then((person) => person ?? known?.person ?? null)
        .catch((error: unknown) => {
          if (known && !expired(error)) return known.person
          throw error
        })
  const [person, titles] = await Promise.all([
    details,
    xboxGet(session, titlesUrl(xuid), "2"),
  ])
  if (!person) return null
  return {
    gamertag: person.gamertag,
    bio: person.bio,
    games: gamesFrom(titles),
    gamerscore: person.gamerscore,
    xuid: person.xuid,
    live: true,
    avatar: person.avatar,
    classicTag: person.classicTag,
    presence: person.presence,
    lastSeen: person.lastSeen,
    tier: person.tier,
    reputation: person.reputation,
    location: person.location,
    tenure: person.tenure,
    verified: person.verified,
    gamePass: person.gamePass,
    followers: person.followers,
    following: person.following,
    color: person.color,
  }
}

export async function lookupMyProfile(): Promise<Profile | null> {
  const session = await requireSession()
  return profileFor(session, session.xuid, null)
}

export async function lookupXboxProfile(tag: string): Promise<Profile | null> {
  const session = await requireSession()
  if (tag.trim().toLowerCase() === session.gamertag.toLowerCase()) return profileFor(session, session.xuid, null)
  const found = await personByTag(session, tag)
  return found ? profileFor(session, found.person.xuid, found) : null
}

export async function lookupAchievements(xuid: string, titleId: string): Promise<Achievement[]> {
  if (!/^\d+$/.test(xuid) || !/^\d+$/.test(titleId)) throw new XboxError("Bad Xbox id.")
  return achievementsFor(await requireSession(), xuid, titleId)
}

// Contract 3 is reported to carry rarity, but it may ignore the titleId filter or answer empty. Ask it first, and
// fall back to contract 2 when the answer fails, comes back empty, or mixes in other games.
async function achievementsFor(session: XboxSession, xuid: string, titleId: string): Promise<Achievement[]> {
  try {
    const withRarity = await achievementPages(session, xuid, titleId, "3")
    if (withRarity && withRarity.length > 0) return withRarity
  } catch (error) {
    if (expired(error)) throw error
  }
  return (await achievementPages(session, xuid, titleId, "2")) ?? []
}

async function achievementPages(session: XboxSession, xuid: string, titleId: string, contract: string) {
  const achievements: Achievement[] = []
  const seen = new Set<string>()
  let token: string | null = null
  // ponytail: 5 pages per game. Raise the cap if a title still comes back short.
  for (let page = 0; page < 5; page += 1) {
    const base = `${ACHIEVEMENTS}/xuid(${xuid})/achievements?titleId=${titleId}&maxItems=1000`
    const path = token ? `${base}&continuationToken=${encodeURIComponent(token)}` : base
    let batch: ReturnType<typeof achievementsFrom>
    try {
      batch = achievementsFrom(await xboxGet(session, path, contract), titleId)
    } catch (error) {
      if (page === 0) throw error
      break
    }
    if (batch.foreign > 0) return null
    for (const achievement of batch.achievements) {
      if (seen.has(achievement.id)) continue
      seen.add(achievement.id)
      achievements.push(achievement)
    }
    if (!batch.continuation || batch.continuation === token) break
    token = batch.continuation
  }
  return achievements
}

/** The signed-in player's friends list, with gamerscore and presence. */
export async function lookupFriends(): Promise<XboxPerson[]> {
  const session = await requireSession()
  const people = peopleFrom(await xboxGet(session, `${PEOPLE}/social/decoration/${PEOPLE_DECORATION}`, "5"))
  return people.filter((person) => person.xuid !== session.xuid)
}

export async function lookupRecentUnlocks(limit = 8): Promise<RecentUnlock[]> {
  const session = await requireSession()
  return unlocksFor(session, session.xuid, limit)
}

/** A player's unlocks across their most recent and most-played games, newest first. */
export async function lookupUnlocks(xuid: string): Promise<RecentUnlock[]> {
  if (!/^\d+$/.test(xuid)) throw new XboxError("Bad Xbox id.")
  return unlocksFor(await requireSession(), xuid, 1000)
}

const FEED_GAMES = 12

// The cross-game achievements query comes back empty, so the feed is built from per-game lists instead: the most
// recently played games plus the ones with the most gamerscore, which is where the latest and rarest unlocks live.
async function unlocksFor(session: XboxSession, xuid: string, limit: number) {
  const games = gamesFrom(await xboxGet(session, titlesUrl(xuid), "2")).filter((game) => (game.earned ?? 0) > 0)
  const recent = [...games].sort((a, b) => (b.lastPlayed ?? "").localeCompare(a.lastPlayed ?? "")).slice(0, FEED_GAMES / 2)
  const biggest = [...games].sort((a, b) => (b.earned ?? 0) - (a.earned ?? 0))
  const picked = [...new Map([...recent, ...biggest].map((game) => [game.id, game])).values()].slice(0, FEED_GAMES)
  const lists = await Promise.allSettled(picked.map((game) => achievementsFor(session, xuid, game.id)))
  const unlocks = lists.flatMap((result, index) =>
    result.status === "fulfilled"
      ? result.value
          .filter((achievement) => achievement.unlockedAt)
          .map((achievement) => ({ achievement, game: picked[index].title, titleId: picked[index].id }))
      : [],
  )
  if (unlocks.length === 0 && lists.some((result) => result.status === "rejected")) {
    const failed = lists.find((result) => result.status === "rejected")
    if (failed?.status === "rejected" && expired(failed.reason)) throw failed.reason
  }
  return unlocks
    .sort((a, b) => (b.achievement.unlockedAt ?? "").localeCompare(a.achievement.unlockedAt ?? ""))
    .slice(0, limit)
}

/**
 * Development only: what the achievements service actually returns for each contract version, for one game and
 * for the cross-game feed. Shows the top-level keys, the count, and the first achievement in full.
 */
export async function inspectAchievements(titleId?: string) {
  const session = await requireSession()
  const games = gamesFrom(await xboxFetch(session, titlesUrl(session.xuid), "2"))
    .filter((game) => (game.earned ?? 0) > 0)
    .sort((a, b) => (b.lastPlayed ?? "").localeCompare(a.lastPlayed ?? ""))
  const id = titleId && /^\d+$/.test(titleId) ? titleId : games[0]?.id
  const ids = games.slice(0, 2).map((game) => game.id)
  const base = `${ACHIEVEMENTS}/xuid(${session.xuid})/achievements`
  const requests: Record<string, string> = {
    game: `${base}?titleId=${id}&maxItems=3`,
    feed: `${base}?unlockedOnly=true&orderBy=unlockTime&maxItems=3`,
    "feed UnlockTime": `${base}?unlockedOnly=true&orderBy=UnlockTime&maxItems=3`,
    "feed two titles": `${base}?titleId=${ids.join(",")}&unlockedOnly=true&maxItems=3`,
  }
  const report: Record<string, unknown> = { titleId: id ?? null, gamesWithScore: games.length }
  for (const [name, url] of Object.entries(requests)) {
    for (const contract of ["2", "3", "4"]) {
      try {
        const body = await xboxFetch(session, url, contract)
        const root = body && typeof body === "object" ? (body as Record<string, unknown>) : {}
        const items = Array.isArray(root.achievements) ? root.achievements : []
        report[`${name} v${contract}`] = { keys: Object.keys(root), count: items.length, first: items[0] ?? null }
      } catch (error) {
        report[`${name} v${contract}`] = { error: error instanceof Error ? error.message : String(error) }
      }
    }
  }
  return report
}

const BASE_CHECKS = 12

/** Which of these games have the main game finished while add-on achievements are still locked. */
export async function lookupBaseComplete(xuid: string, titleIds: string[]): Promise<string[]> {
  if (!/^\d+$/.test(xuid) || titleIds.some((id) => !/^\d+$/.test(id))) throw new XboxError("Bad Xbox id.")
  const session = await requireSession()
  const ids = [...new Set(titleIds)].slice(0, BASE_CHECKS)
  const results = await Promise.allSettled(ids.map((id) => achievementsFor(session, xuid, id)))
  return ids.filter((_, index) => {
    const result = results[index]
    return result.status === "fulfilled" && completionTier(result.value) === "base"
  })
}

export type NextUp = { achievement: Achievement; game: Game }

const PLANNED_GAMES = 6
const PER_GAME = 3

function completion(game: Game) {
  return game.total ? (game.earned ?? 0) / game.total : 0
}

/**
 * The easiest gamerscore still on the table: locked achievements from the player's closest-to-done games,
 * most commonly unlocked first. Time-limited challenges are left out; achievements without rarity data come last,
 * those already in progress first, then the cheapest.
 */
export async function lookupNextUp(games: Game[], limit = 8): Promise<NextUp[]> {
  const session = await requireSession()
  const candidates = games
    .filter((game) => (game.total ?? 0) > 0 && (game.earned ?? 0) < (game.total ?? 0))
    .sort((a, b) => completion(b) - completion(a))
    .slice(0, PLANNED_GAMES)
  const lists = await Promise.allSettled(candidates.map((game) => achievementsFor(session, session.xuid, game.id)))
  const picks = lists.flatMap((result, index) => {
    if (result.status === "rejected") return []
    return result.value
      .filter((achievement) => !achievement.unlockedAt && achievement.kind !== "Challenge")
      .sort(easiestFirst)
      .slice(0, PER_GAME)
      .map((achievement) => ({ achievement, game: candidates[index] }))
  })
  if (picks.length === 0 && lists.some((result) => result.status === "rejected")) {
    const failed = lists.find((result) => result.status === "rejected")
    if (failed?.status === "rejected") throw failed.reason
  }
  return picks.sort((a, b) => easiestFirst(a.achievement, b.achievement)).slice(0, limit)
}

function easiestFirst(a: Achievement, b: Achievement) {
  if (a.rarity != null && b.rarity != null) return b.rarity - a.rarity || b.score - a.score
  if (a.rarity != null) return -1
  if (b.rarity != null) return 1
  return Number(Boolean(b.progress)) - Number(Boolean(a.progress)) || a.score - b.score
}
