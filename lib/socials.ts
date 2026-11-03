// Social links on a profile. Players enter handles, never raw URLs, so every link points at the network it claims.

export const NETWORKS = [
  { key: "twitch", label: "Twitch", url: (handle: string) => `https://twitch.tv/${handle}` },
  { key: "youtube", label: "YouTube", url: (handle: string) => `https://youtube.com/@${handle}` },
  { key: "x", label: "X", url: (handle: string) => `https://x.com/${handle}` },
  { key: "instagram", label: "Instagram", url: (handle: string) => `https://instagram.com/${handle}` },
  { key: "tiktok", label: "TikTok", url: (handle: string) => `https://tiktok.com/@${handle}` },
  { key: "discord", label: "Discord", url: null },
] as const

export type Network = (typeof NETWORKS)[number]["key"]
export type Socials = Partial<Record<Network, string>>

const HANDLE = /^[A-Za-z0-9._-]{1,40}$/

/** Accepts "name", "@name", or a pasted profile URL, and keeps only a plain handle. */
export function cleanHandle(value: unknown) {
  if (typeof value !== "string") return null
  let handle = value.trim()
  if (!handle) return null
  if (/^https?:\/\//i.test(handle) || handle.includes("/")) {
    const parts = handle.replace(/^https?:\/\//i, "").split(/[/?#]/).filter(Boolean)
    handle = parts[parts.length - 1] ?? ""
  }
  handle = handle.replace(/^@/, "")
  return HANDLE.test(handle) ? handle : null
}

export function cleanSocials(input: Record<string, unknown>): Socials {
  const socials: Socials = {}
  for (const network of NETWORKS) {
    const handle = cleanHandle(input[network.key])
    if (handle) socials[network.key] = handle
  }
  return socials
}
