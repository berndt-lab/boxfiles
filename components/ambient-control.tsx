"use client"

import { useEffect, useRef, useState } from "react"
import {
  DEFAULT_AMBIENT,
  PRESETS,
  THEMES,
  applyAmbient,
  hexToHue,
  hueToHex,
  loadAmbient,
  saveAmbient,
  xboxColor,
  zoneColors,
  type Ambient,
} from "@/lib/ambient"

const RAINBOW = "linear-gradient(90deg, #ff3333, #ffb300, #b6ff33, #33ff80, #33ffff, #3380ff, #b333ff, #ff33b3, #ff3333)"

/** The lights button in the header, and the panel for tuning the site's ambient lighting like a car interior. */
export function AmbientControl() {
  const [open, setOpen] = useState(false)
  const [ambient, setAmbient] = useState<Ambient>(DEFAULT_AMBIENT)
  const [xbox, setXbox] = useState<string | null>(null)
  const [zone, setZone] = useState<1 | 2>(1)
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }
    document.addEventListener("pointerdown", close)
    document.addEventListener("keydown", escape)
    return () => {
      document.removeEventListener("pointerdown", close)
      document.removeEventListener("keydown", escape)
    }
  }, [open])

  function toggle() {
    if (!open) {
      setAmbient(loadAmbient())
      setXbox(xboxColor())
      setZone(1)
    }
    setOpen(!open)
  }

  function update(next: Ambient) {
    setAmbient(next)
    applyAmbient(next)
    saveAmbient(next)
  }

  function pick(color: string) {
    update(zone === 1 ? { ...ambient, source: "custom", a: color } : { ...ambient, b: color })
  }

  const { first, second } = zoneColors(ambient)
  const editing = zone === 1 ? first : second
  const followsXbox = zone === 1 && ambient.source === "xbox" && xbox !== null

  return (
    <div ref={root} className="relative shrink-0">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls="ambient-panel"
        aria-label="Ambient lighting"
        title="Ambient lighting"
        className="group grid size-9 place-items-center rounded-full border border-line transition-colors hover:border-line-strong"
      >
        <span
          className="ambient-glow size-3.5 rounded-full transition-transform duration-300 group-hover:scale-110"
          style={{ background: "linear-gradient(135deg, rgb(var(--ambient)), rgb(var(--ambient-2)))" }}
          aria-hidden
        />
      </button>

      {open && (
        <div
          id="ambient-panel"
          role="dialog"
          aria-label="Ambient lighting"
          className="material light-strip fixed inset-x-4 top-16 z-30 overflow-hidden sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[21rem] rounded-2xl border border-line-strong shadow-[0_24px_60px_rgb(0_0_0/0.6)]"
        >
          <div className="flex items-baseline justify-between gap-3 px-4 pt-4">
            <h2 className="text-sm font-medium">Ambient lighting</h2>
            <span className="text-[11px] text-faint">Saved on this device</span>
          </div>

          <div className="mx-4 mt-3 grid grid-cols-2 rounded-full border border-line p-0.5 text-xs">
            {[false, true].map((dual) => (
              <button
                key={String(dual)}
                type="button"
                aria-pressed={ambient.dual === dual}
                onClick={() => {
                  update({ ...ambient, dual })
                  setZone(1)
                }}
                className={`h-7 rounded-full transition-colors ${
                  ambient.dual === dual ? "bg-raised text-foreground ring-1 ring-line-strong" : "text-muted hover:text-foreground"
                }`}
              >
                {dual ? "Dual zone" : "Single zone"}
              </button>
            ))}
          </div>

          {ambient.dual && (
            <div className="mx-4 mt-3 flex gap-2">
              {([1, 2] as const).map((which) => (
                <button
                  key={which}
                  type="button"
                  aria-pressed={zone === which}
                  onClick={() => setZone(which)}
                  className={`flex h-8 flex-1 items-center justify-center gap-2 rounded-xl border text-xs transition-colors ${
                    zone === which ? "border-line-strong bg-raised text-foreground" : "border-line text-muted hover:text-foreground"
                  }`}
                >
                  <span
                    className="size-2.5 rounded-full"
                    style={{ background: which === 1 ? first : second, boxShadow: `0 0 8px ${which === 1 ? first : second}` }}
                    aria-hidden
                  />
                  {which === 1 ? "Left zone" : "Right zone"}
                </button>
              ))}
            </div>
          )}

          <div className="mt-4 px-4">
            <p className="text-[11px] uppercase tracking-[0.08em] text-faint">Color</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {zone === 1 && xbox && (
                <Swatch
                  color={xbox}
                  label="My Xbox color"
                  selected={followsXbox}
                  onClick={() => update({ ...ambient, source: "xbox" })}
                  badge
                />
              )}
              {PRESETS.map((preset) => (
                <Swatch
                  key={preset.name}
                  color={preset.color}
                  label={preset.name}
                  selected={!followsXbox && editing.toLowerCase() === preset.color}
                  onClick={() => pick(preset.color)}
                />
              ))}
            </div>
            <label className="mt-3 block">
              <span className="sr-only">Fine-tune color</span>
              <input
                type="range"
                min={0}
                max={359}
                value={hexToHue(editing)}
                onChange={(event) => pick(hueToHex(Number(event.target.value)))}
                className="ambient-range w-full"
                style={{ background: RAINBOW }}
              />
            </label>
          </div>

          <div className="mt-4 px-4">
            <p className="text-[11px] uppercase tracking-[0.08em] text-faint">Themes</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {THEMES.map((theme) => {
                const active = ambient.dual && ambient.source === "custom" && ambient.a === theme.a && ambient.b === theme.b
                return (
                  <button
                    key={theme.name}
                    type="button"
                    aria-pressed={active}
                    onClick={() => update({ ...ambient, source: "custom", a: theme.a, b: theme.b, dual: true })}
                    className={`flex h-9 items-center gap-2.5 rounded-xl border px-3 text-xs transition-colors ${
                      active ? "border-line-strong bg-raised text-foreground" : "border-line text-muted hover:text-foreground"
                    }`}
                  >
                    <span
                      className="h-1.5 w-6 rounded-full"
                      style={{ background: `linear-gradient(90deg, ${theme.a}, ${theme.b})`, boxShadow: `0 0 8px ${theme.a}` }}
                      aria-hidden
                    />
                    {theme.name}
                  </button>
                )
              })}
            </div>
          </div>

          <label className="mt-4 block px-4">
            <span className="flex items-baseline justify-between text-[11px] uppercase tracking-[0.08em] text-faint">
              Brightness
              <span className="tabular-nums normal-case tracking-normal text-muted">
                {ambient.level === 0 ? "Off" : `${ambient.level}%`}
              </span>
            </span>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={ambient.level}
              onChange={(event) => update({ ...ambient, level: Number(event.target.value) })}
              className="ambient-range mt-2 w-full"
              style={{
                background: `linear-gradient(90deg, rgb(var(--ambient) / 0.9) ${ambient.level}%, rgb(255 255 255 / 0.08) ${ambient.level}%)`,
              }}
            />
          </label>

          <div className="mt-4 flex justify-end border-t border-line px-4 py-3">
            <button
              type="button"
              onClick={() => {
                update(DEFAULT_AMBIENT)
                setZone(1)
              }}
              className="text-xs text-muted transition-colors hover:text-foreground"
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Swatch({
  color,
  label,
  selected,
  onClick,
  badge = false,
}: {
  color: string
  label: string
  selected: boolean
  onClick: () => void
  badge?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      aria-label={label}
      title={label}
      className={`relative grid size-8 place-items-center rounded-full transition-transform duration-200 hover:scale-110 ${
        selected ? "outline-2 outline-offset-2 outline-foreground" : ""
      }`}
      style={{ background: color, boxShadow: `0 0 12px ${color}88` }}
    >
      {badge && (
        <svg viewBox="0 0 24 24" className="size-4 text-black/70" aria-hidden>
          <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="2.2" />
          <path
            d="M8.3 7.6c1.6 1.1 2.8 2.4 3.7 3.9.9-1.5 2.1-2.8 3.7-3.9M7.9 16.5c1.1-1.9 2.4-3.4 4.1-4.5 1.7 1.1 3 2.6 4.1 4.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      )}
    </button>
  )
}
