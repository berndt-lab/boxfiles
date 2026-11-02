export type Achievement = {
  id: string
  name: string
  description: string
  score: number
  /** Percent of players who unlocked it. */
  rarity: number
  unlockedAt: string | null
  icon?: string
  platforms?: string[]
  /** Partial progress such as "2/5", when Xbox sends it. */
  progress?: string
  /** Challenge, when the achievement is time-limited. */
  kind?: string
  estimate?: string
}

export type Game = {
  id: string
  title: string
  achievements: Achievement[]
  /** Set when a live game's achievement list has been fetched, even if it was empty. */
  achievementsLoaded?: boolean
  earned?: number
  total?: number
  unlockedCount?: number
  achievementCount?: number
  image?: string
  devices?: string[]
  lastPlayed?: string
}

export type Profile = {
  gamertag: string
  bio: string
  games: Game[]
  /** Account gamerscore from Xbox. Title history is the fallback. */
  gamerscore?: number
  xuid?: string
  live?: boolean
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

export type RarityTone = "ultra" | "very" | "rare" | "uncommon" | "common"

export type Rarest = {
  name: string
  game: string
  rarity: number
  score: number
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

export const rarityColor: Record<RarityTone, string> = {
  ultra: "#f5c542",
  very: "#d2a6ff",
  rare: "#6ec8ff",
  uncommon: "#5ee08a",
  common: "#b7c4bc",
}

export function rarityTier(percent: number): { label: string; tone: RarityTone } {
  if (percent < 5) return { label: "Ultra Rare", tone: "ultra" }
  if (percent < 10) return { label: "Very Rare", tone: "very" }
  if (percent < 25) return { label: "Rare", tone: "rare" }
  if (percent < 50) return { label: "Uncommon", tone: "uncommon" }
  return { label: "Common", tone: "common" }
}

type ScoreGame = {
  achievements: Array<{ score: number; unlockedAt: string | null }>
  earned?: number
  total?: number
  unlockedCount?: number
  achievementCount?: number
}

export function gameTally(game: ScoreGame) {
  if (game.achievements.length === 0 && (game.earned != null || game.total != null)) {
    const earned = game.earned ?? 0
    const total = game.total ?? 0
    const unlocked = game.unlockedCount ?? 0
    const count = game.achievementCount ?? 0
    return { earned, total, unlocked, count, completion: total === 0 ? 0 : earned / total }
  }
  let earned = 0
  let total = 0
  let unlocked = 0
  for (const achievement of game.achievements) {
    total += achievement.score
    if (achievement.unlockedAt) {
      earned += achievement.score
      unlocked += 1
    }
  }
  return {
    earned,
    total,
    unlocked,
    count: game.achievements.length,
    completion: total === 0 ? 0 : earned / total,
  }
}

export function tally(games: Array<{ title: string; achievements: Achievement[] } & ScoreGame>) {
  let earned = 0
  let total = 0
  let unlocked = 0
  let count = 0
  let rarest: Rarest | null = null
  for (const game of games) {
    const scores = gameTally(game)
    earned += scores.earned
    total += scores.total
    unlocked += scores.unlocked
    count += scores.count
    for (const achievement of game.achievements) {
      if (!achievement.unlockedAt) continue
      if (!rarest || achievement.rarity < rarest.rarity) {
        rarest = {
          name: achievement.name,
          game: game.title,
          rarity: achievement.rarity,
          score: achievement.score,
        }
      }
    }
  }
  return {
    earned,
    total,
    unlocked,
    count,
    rarest,
    completion: total === 0 ? 0 : earned / total,
  }
}

export function words(value: string) {
  return value.replace(/([a-z])([A-Z])/g, "$1 $2")
}

export function formatGs(n: number) {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

export function formatPct(ratio: number) {
  return `${Math.round(ratio * 100)}%`
}

export function formatRarity(n: number) {
  return `${n < 10 ? n.toFixed(1) : Math.round(n)}%`
}

export function formatUnlocked(iso: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  if (!match) return "Unlocked"
  return `${Number(match[3])} ${MONTHS[Number(match[2]) - 1]} ${match[1]}`
}

export function initials(title: string) {
  const words = title.split(/\s+/).filter((word) => /[0-9A-Za-z]/.test(word[0] ?? ""))
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase()
  const caps = words[0]?.match(/[A-Z]/g) ?? []
  if (caps.length >= 2) return (caps[0] + caps[1]).toUpperCase()
  return (words[0] ?? title).slice(0, 2).toUpperCase()
}

export function tileHue(title: string) {
  let hue = 0
  for (const char of title) hue = (hue * 33 + char.charCodeAt(0)) % 360
  return hue
}
