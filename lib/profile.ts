import { profiles } from "@/data/profiles"
import { tally, type Profile } from "@/lib/format"

function decodeTag(tag: string) {
  try {
    return decodeURIComponent(tag).trim()
  } catch {
    return tag.trim()
  }
}

export function displayTag(tag: string) {
  return decodeTag(tag).slice(0, 40)
}

export function findProfile(tag: string): Profile | null {
  const key = decodeTag(tag).toLowerCase()
  if (!key) return null
  return profiles.find((profile) => profile.gamertag.toLowerCase() === key) ?? null
}

export function listProfiles() {
  return [...profiles].sort((a, b) => tally(b.games).earned - tally(a.games).earned)
}
