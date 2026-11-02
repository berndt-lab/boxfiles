import type { Achievement, Game } from "@/lib/format"

export type XboxPerson = {
  xuid: string
  gamertag: string
  gamerscore: number
  bio: string
  names: string[]
  avatar?: string
  classicTag?: string
  presence?: string
  lastSeen?: string
  tier?: string
  reputation?: string
  location?: string
  tenure?: string
  verified?: boolean
  gamePass?: boolean
  followers?: number
  following?: number
}

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function num(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value)
  return 0
}

function list(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function payload(data: unknown) {
  const root = record(data)
  return record(root?.content) ?? root
}

export function peopleFrom(data: unknown): XboxPerson[] {
  const body = payload(data)
  const people = list(body?.people).flatMap((item) => {
    const person = mapPerson(item)
    return person ? [person] : []
  })
  const profiles = list(body?.profileUsers).flatMap((item) => {
    const person = mapProfileUser(item)
    return person ? [person] : []
  })
  return [...people, ...profiles]
}

export function pickPerson(people: XboxPerson[], tag: string): XboxPerson | null {
  const query = tag.trim().toLowerCase()
  if (!query) return null
  return people.find((person) => person.names.some((name) => name.toLowerCase() === query)) ?? null
}

function mapPerson(value: unknown): XboxPerson | null {
  const person = record(value)
  if (!person) return null
  const xuid = text(person.xuid)
  const gamertag = text(person.uniqueModernGamertag) || text(person.gamertag) || text(person.modernGamertag)
  if (!xuid || !gamertag) return null
  const names = [person.gamertag, person.modernGamertag, person.uniqueModernGamertag].map(text).filter(Boolean)
  const detail = record(person.detail)
  const classic = text(person.gamertag)
  return {
    xuid,
    gamertag,
    gamerscore: num(person.gamerScore ?? person.gamerscore),
    bio: text(detail?.bio),
    names,
    avatar: text(person.displayPicRaw) || undefined,
    classicTag: classic && classic !== gamertag ? classic : undefined,
    presence: text(person.presenceText) || text(person.presenceState) || undefined,
    lastSeen: text(person.lastSeenDateTimeUtc) || undefined,
    tier: text(detail?.accountTier) || undefined,
    reputation: text(person.xboxOneRep) || undefined,
    location: text(detail?.location) || undefined,
    tenure: text(detail?.tenure) || undefined,
    verified: detail?.isVerified === true,
    gamePass: detail?.hasGamePass === true,
    followers: detail && "followerCount" in detail ? num(detail.followerCount) : undefined,
    following: detail && "followingCount" in detail ? num(detail.followingCount) : undefined,
  }
}

function mapProfileUser(value: unknown): XboxPerson | null {
  const user = record(value)
  if (!user) return null
  const settings = new Map<string, string>()
  for (const item of list(user.settings)) {
    const row = record(item)
    if (!row) continue
    settings.set(text(row.id), text(row.value))
  }
  const xuid = text(user.id) || text(user.hostId)
  const gamertag = settings.get("UniqueModernGamertag") || settings.get("Gamertag") || settings.get("ModernGamertag") || ""
  if (!xuid || !gamertag) return null
  const names = ["Gamertag", "ModernGamertag", "UniqueModernGamertag"]
    .map((key) => settings.get(key) ?? "")
    .filter(Boolean)
  const classic = settings.get("Gamertag") ?? ""
  const tenure = settings.get("TenureLevel") ?? ""
  return {
    xuid,
    gamertag,
    gamerscore: num(settings.get("Gamerscore")),
    bio: settings.get("Bio") ?? "",
    names,
    avatar: settings.get("GameDisplayPicRaw") || undefined,
    classicTag: classic && classic !== gamertag ? classic : undefined,
    tier: settings.get("AccountTier") || undefined,
    reputation: settings.get("XboxOneRep") || undefined,
    location: settings.get("Location") || undefined,
    tenure: tenure && tenure !== "0" ? tenure : undefined,
  }
}

export function gamesFrom(data: unknown): Game[] {
  const titles = list(payload(data)?.titles)
  const seen = new Set<string>()
  const ranked: Game[] = []
  for (const item of titles) {
    const mapped = mapTitle(item)
    if (!mapped || seen.has(mapped.id)) continue
    seen.add(mapped.id)
    ranked.push(mapped)
  }
  ranked.sort((a, b) => (b.lastPlayed ?? "").localeCompare(a.lastPlayed ?? ""))
  return ranked
}

function mapTitle(value: unknown): Game | null {
  const title = record(value)
  if (!title) return null
  const id = text(title.titleId)
  const name = text(title.name)
  if (!id || !name) return null
  const achievement = record(title.achievement)
  const earned = num(achievement?.currentGamerscore ?? title.currentGamerscore)
  const total = num(achievement?.totalGamerscore ?? title.maxGamerscore)
  const kind = text(title.type)
  if (kind && kind !== "Game" && earned === 0 && total === 0) return null
  const history = record(title.titleHistory)
  const devices = texts(title.devices)
  return {
    id,
    title: name,
    achievements: [],
    earned,
    total,
    unlockedCount: num(achievement?.currentAchievements ?? title.earnedAchievements),
    achievementCount: num(achievement?.totalAchievements) || undefined,
    image: text(title.displayImage) || undefined,
    devices: devices.length > 0 ? devices : undefined,
    lastPlayed: text(history?.lastTimePlayed) || undefined,
  }
}

export function achievementsFrom(data: unknown, titleId: string): { achievements: Achievement[]; continuation: string | null } {
  const root = payload(data)
  const achievements = list(root?.achievements).flatMap((item) => {
    const achievement = mapAchievement(item, titleId)
    return achievement ? [achievement] : []
  })
  const continuation = text(record(root?.pagingInfo)?.continuationToken)
  return { achievements, continuation: continuation || null }
}

export function mapAchievement(value: unknown, titleId: string): Achievement | null {
  const raw = record(value)
  if (!raw) return null
  const name = text(raw.name)
  const sourceId = text(raw.id)
  if (!name || !sourceId) return null
  const progress = text(raw.progressState).toLowerCase()
  const unlocked = progress === "achieved" && raw.isRevoked !== true
  const progression = record(raw.progression)
  const when = text(progression?.timeUnlocked)
  let score = 0
  for (const reward of list(raw.rewards)) {
    const item = record(reward)
    if (item && text(item.type).toLowerCase() === "gamerscore") score += num(item.value)
  }
  const rarity = record(raw.rarity)
  const percent = rarity && "currentPercentage" in rarity ? num(rarity.currentPercentage) : 100
  const secret = raw.isSecret === true
  const description = unlocked
    ? text(raw.description) || text(raw.lockedDescription)
    : secret
      ? "Secret achievement."
      : text(raw.lockedDescription) || text(raw.description) || "Locked."
  const platforms = texts(raw.platforms)
  const kind = text(raw.achievementType)
  const estimate = formatDuration(text(raw.estimatedTime))
  return {
    id: `${titleId}:${sourceId}`,
    name,
    description,
    score,
    rarity: percent,
    unlockedAt: unlocked ? when.slice(0, 10) || "achieved" : null,
    icon: iconUrl(raw.mediaAssets),
    platforms: platforms.length > 0 ? platforms : undefined,
    progress: progressLabel(raw.progression),
    kind: kind === "Challenge" ? "Challenge" : undefined,
    estimate: estimate || undefined,
  }
}

function texts(value: unknown) {
  if (typeof value === "string" && value.trim()) return [value.trim()]
  return list(value).map(text).filter(Boolean)
}

function iconUrl(value: unknown) {
  const assets = list(value).map(record).filter((item) => item !== null)
  const icon = assets.find((item) => text(item.type).toLowerCase() === "icon") ?? assets[0]
  return text(icon?.url) || undefined
}

function progressLabel(value: unknown) {
  for (const item of list(record(value)?.requirements)) {
    const requirement = record(item)
    if (!requirement) continue
    const current = text(requirement.current)
    const target = text(requirement.target)
    if (current && target && current !== target) return `${current}/${target}`
  }
  return undefined
}

function formatDuration(value: string) {
  const match = /^(\d+):(\d+):(\d+)/.exec(value)
  if (!match) return ""
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (!hours && !minutes) return ""
  return hours ? `${hours}h ${minutes}m` : `${minutes}m`
}

export type RecentUnlock = { achievement: Achievement; game: string; titleId: string }

/** Cross-game unlock feed: each achievement names its game in titleAssociations. */
export function recentUnlocksFrom(data: unknown): RecentUnlock[] {
  return list(payload(data)?.achievements).flatMap((item) => {
    const raw = record(item)
    const title = record(list(raw?.titleAssociations)[0])
    const titleId = title && (typeof title.id === "number" || typeof title.id === "string") ? String(title.id) : ""
    const achievement = titleId ? mapAchievement(raw, titleId) : null
    if (!achievement?.unlockedAt) return []
    return [{ achievement, game: text(title?.name), titleId }]
  })
}
