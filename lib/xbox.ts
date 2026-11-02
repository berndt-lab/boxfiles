import { cookies } from "next/headers"
import type { Achievement, Profile } from "@/lib/format"
import { SESSION_COOKIE, unseal, type XboxSession } from "@/lib/session"
import { achievementsFrom, gamesFrom, peopleFrom, pickPerson, type XboxPerson } from "@/lib/xbox-map"

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
  return session && session.expiresAt > Date.now() ? session : null
}

async function requireSession() {
  const session = await currentSession()
  if (!session) throw new XboxError("Sign in with Xbox to load live profiles.")
  return session
}

async function xboxGet(session: XboxSession, url: string, contract: string): Promise<unknown> {
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

/** Peoplehub has presence and followers; profile settings is the plainer fallback. */
async function personByXuid(session: XboxSession, xuid: string): Promise<XboxPerson | null> {
  const id = encodeURIComponent(xuid)
  try {
    const rich = peopleFrom(await xboxGet(session, `${PEOPLE}/xuids(${id})/decoration/${PEOPLE_DECORATION}`, "5"))
    if (rich[0]) return rich[0]
  } catch (error) {
    if (error instanceof XboxError && error.message.includes("expired")) throw error
  }
  return peopleFrom(await xboxGet(session, `${PROFILE}/xuid(${id})/profile/settings?settings=${SETTINGS}`, "3"))[0] ?? null
}

async function personByTag(session: XboxSession, tag: string): Promise<XboxPerson | null> {
  try {
    const found = pickPerson(
      peopleFrom(
        await xboxGet(session, `${PEOPLE}/search/decoration/${PEOPLE_DECORATION}?q=${encodeURIComponent(tag)}&maxItems=25`, "5"),
      ),
      tag,
    )
    if (found) return found
  } catch (error) {
    if (error instanceof XboxError && error.message.includes("expired")) throw error
  }
  const exact = pickPerson(
    peopleFrom(await xboxGet(session, `${PROFILE}/gt(${encodeURIComponent(tag)})/profile/settings?settings=${SETTINGS}`, "3")),
    tag,
  )
  return exact ? ((await personByXuid(session, exact.xuid)) ?? exact) : null
}

async function profileFromPerson(session: XboxSession, person: XboxPerson): Promise<Profile> {
  const titles = await xboxGet(
    session,
    `${TITLES}/xuid(${encodeURIComponent(person.xuid)})/titles/titlehistory/decoration/achievement,image?maxItems=500`,
    "2",
  )
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
  }
}

export async function lookupMyProfile(): Promise<Profile | null> {
  const session = await requireSession()
  const person = await personByXuid(session, session.xuid)
  return person ? profileFromPerson(session, person) : null
}

export async function lookupXboxProfile(tag: string): Promise<Profile | null> {
  const session = await requireSession()
  const mine = tag.trim().toLowerCase() === session.gamertag.toLowerCase()
  const person = mine ? await personByXuid(session, session.xuid) : await personByTag(session, tag)
  return person ? profileFromPerson(session, person) : null
}

export async function lookupAchievements(xuid: string, titleId: string): Promise<Achievement[]> {
  if (!/^\d+$/.test(xuid) || !/^\d+$/.test(titleId)) throw new XboxError("Bad Xbox id.")
  const session = await requireSession()
  const achievements: Achievement[] = []
  const seen = new Set<string>()
  let token: string | null = null
  // ponytail: 5 pages per game. Raise the cap if a title still comes back short.
  for (let page = 0; page < 5; page += 1) {
    const base = `${ACHIEVEMENTS}/xuid(${xuid})/achievements?titleId=${titleId}&maxItems=1000`
    const path = token ? `${base}&continuationToken=${encodeURIComponent(token)}` : base
    let batch: ReturnType<typeof achievementsFrom>
    try {
      batch = achievementsFrom(await xboxGet(session, path, "2"), titleId)
    } catch (error) {
      if (page === 0) throw error
      break
    }
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
