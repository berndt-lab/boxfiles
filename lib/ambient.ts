// Ambient lighting, chosen per viewer and kept in this browser only.
// AMBIENT_SCRIPT applies the saved choice before first paint; applyAmbient does the same live.

export type Ambient = {
  /** "xbox" follows the signed-in player's Xbox profile color, only once they pick it; "custom" uses `a`. */
  source: "xbox" | "custom"
  a: string
  b: string
  dual: boolean
  /** Brightness, 0 (off) to 100. */
  level: number
}

const KEY = "boxfiles:ambient"
const XBOX_KEY = "boxfiles:xbox-color"

/** Nebula: violet into ice blue, the look everyone starts with until they choose their own. */
export const DEFAULT_AMBIENT: Ambient = { source: "custom", a: "#9b5cff", b: "#4cc3ff", dual: true, level: 70 }

export const PRESETS = [
  { name: "Polar", color: "#d6ecff" },
  { name: "Ice", color: "#4cc3ff" },
  { name: "Sapphire", color: "#3b6cff" },
  { name: "Violet", color: "#9b5cff" },
  { name: "Magenta", color: "#ff3fb4" },
  { name: "Crimson", color: "#ff3b4e" },
  { name: "Ember", color: "#ff7a2f" },
  { name: "Amber", color: "#ffb347" },
  { name: "Lime", color: "#7ce35a" },
]

export const THEMES = [
  { name: "Sunset", a: "#ff7a2f", b: "#ff3fb4" },
  { name: "Aurora", a: "#2ee6a8", b: "#4cc3ff" },
  { name: "Nebula", a: "#9b5cff", b: "#4cc3ff" },
  { name: "Inferno", a: "#ff3b4e", b: "#ffb347" },
]

const HEX = /^#[0-9a-f]{6}$/i

function triplet(hex: string) {
  const value = hex.slice(1)
  return [0, 2, 4].map((at) => parseInt(value.slice(at, at + 2), 16)).join(" ")
}

export function loadAmbient(): Ambient {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "null") as Partial<Ambient> | null
    if (!saved) return DEFAULT_AMBIENT
    return {
      source: saved.source === "xbox" ? "xbox" : "custom",
      a: typeof saved.a === "string" && HEX.test(saved.a) ? saved.a : DEFAULT_AMBIENT.a,
      b: typeof saved.b === "string" && HEX.test(saved.b) ? saved.b : DEFAULT_AMBIENT.b,
      dual: saved.dual === true,
      level: typeof saved.level === "number" ? Math.max(0, Math.min(100, saved.level)) : DEFAULT_AMBIENT.level,
    }
  } catch {
    return DEFAULT_AMBIENT
  }
}

export function saveAmbient(ambient: Ambient) {
  try {
    localStorage.setItem(KEY, JSON.stringify(ambient))
  } catch {}
}

export function xboxColor() {
  try {
    const color = localStorage.getItem(XBOX_KEY)
    return color && HEX.test(color) ? color : null
  } catch {
    return null
  }
}

export function rememberXboxColor(color: string) {
  if (!HEX.test(color)) return
  try {
    localStorage.setItem(XBOX_KEY, color)
  } catch {}
}

export function zoneColors(ambient: Ambient) {
  const first = ambient.source === "xbox" ? (xboxColor() ?? ambient.a) : ambient.a
  return { first, second: ambient.dual ? ambient.b : first }
}

export function applyAmbient(ambient: Ambient) {
  const { first, second } = zoneColors(ambient)
  const root = document.documentElement.style
  root.setProperty("--ambient", triplet(first))
  root.setProperty("--ambient-2", triplet(second))
  root.setProperty("--glow", String(ambient.level / 100))
}

export function hueToHex(hue: number) {
  // Fixed saturation and lightness keep every hue as vivid as a light strip.
  const s = 0.95
  const l = 0.6
  const k = (n: number) => (n + hue / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const channel = (n: number) => {
    const value = l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
    return Math.round(value * 255)
      .toString(16)
      .padStart(2, "0")
  }
  return `#${channel(0)}${channel(8)}${channel(4)}`
}

export function hexToHue(hex: string) {
  const [r, g, b] = [1, 3, 5].map((at) => parseInt(hex.slice(at, at + 2), 16) / 255)
  const max = Math.max(r, g, b)
  const delta = max - Math.min(r, g, b)
  if (delta === 0) return 0
  const hue = max === r ? ((g - b) / delta) % 6 : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4
  return Math.round((hue * 60 + 360) % 360)
}

/** Runs in <head> before paint, so the saved lighting shows without a flash of the default. */
export const AMBIENT_SCRIPT = `try{var d=${JSON.stringify(DEFAULT_AMBIENT)},s=JSON.parse(localStorage.getItem("${KEY}")||"null")||d,x=localStorage.getItem("${XBOX_KEY}"),h=/^#[0-9a-f]{6}$/i,a=s.source==="xbox"&&x&&h.test(x)?x:(h.test(s.a||"")?s.a:d.a),b=s.dual&&h.test(s.b||"")?s.b:a,t=function(c){return[1,3,5].map(function(i){return parseInt(c.slice(i,i+2),16)}).join(" ")},r=document.documentElement.style;r.setProperty("--ambient",t(a));r.setProperty("--ambient-2",t(b));r.setProperty("--glow",String((typeof s.level==="number"?s.level:d.level)/100))}catch(e){}`
