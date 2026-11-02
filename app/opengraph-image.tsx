import { ImageResponse } from "next/og"

export const alt = "boxfiles: your next 1,000 gamerscore, mapped out"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function Image() {
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
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 38, fontWeight: 700 }}>
          <div style={{ width: 20, height: 20, borderRadius: 10, background: "#2ec12e" }} />
          boxfiles
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 84, fontWeight: 700, letterSpacing: -2, lineHeight: 1.05 }}>
            Your next 1,000 gamerscore, mapped out.
          </div>
          <div style={{ fontSize: 32, color: "#8f9098", marginTop: 24 }}>
            Easiest unlocks left · Friends rivalry · Rare achievements worth sharing
          </div>
        </div>
      </div>
    ),
    size,
  )
}
