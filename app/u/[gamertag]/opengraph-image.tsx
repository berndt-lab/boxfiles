import { ImageResponse } from "next/og"
import { formatGs, formatPct } from "@/lib/format"
import { entryByTag } from "@/lib/leaderboard"
import { displayTag } from "@/lib/profile"

export const alt = "boxfiles profile card"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

/** Inlines the avatar so a slow or missing Xbox image never breaks the card. */
async function avatarData(url: string | undefined) {
  if (!url?.startsWith("https://")) return null
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(2500) })
    const type = response.headers.get("content-type") ?? ""
    if (!response.ok || !type.startsWith("image/")) return null
    return `data:${type};base64,${Buffer.from(await response.arrayBuffer()).toString("base64")}`
  } catch {
    return null
  }
}

export default async function Image({ params }: { params: Promise<{ gamertag: string }> }) {
  const { gamertag } = await params
  const entry = await entryByTag(displayTag(gamertag)).catch(() => null)
  const avatar = await avatarData(entry?.avatar)
  const completion = entry && entry.total > 0 ? entry.earned / entry.total : 0
  const name = entry?.gamertag ?? displayTag(gamertag)
  const stats = entry
    ? [
        { label: "Gamerscore", value: `${formatGs(entry.gamerscore)}G` },
        { label: "Games", value: formatGs(entry.games) },
        { label: "Completion", value: formatPct(completion) },
      ]
    : []

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "radial-gradient(900px 420px at 0% 0%, rgba(46,193,46,0.22), transparent 70%), #000",
          color: "#ededef",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt="" width={168} height={168} style={{ borderRadius: 84 }} />
          ) : (
            <div
              style={{
                width: 168,
                height: 168,
                borderRadius: 84,
                background: "#141417",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 64,
                color: "#8f9098",
              }}
            >
              {name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 76, fontWeight: 700, letterSpacing: -2 }}>{name}</div>
            <div style={{ fontSize: 30, color: "#8f9098", marginTop: 8 }}>
              {entry ? "Xbox achievements on boxfiles" : "See this Xbox profile on boxfiles"}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 64 }}>
            {stats.map((stat) => (
              <div key={stat.label} style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: 26, color: "#8f9098" }}>{stat.label}</div>
                <div style={{ fontSize: 64, fontWeight: 700, marginTop: 4 }}>{stat.value}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 34, fontWeight: 700 }}>
            <div style={{ width: 18, height: 18, borderRadius: 9, background: "#2ec12e" }} />
            boxfiles
          </div>
        </div>
      </div>
    ),
    size,
  )
}
