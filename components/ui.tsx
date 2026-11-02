import type { ReactNode } from "react"
import { initials, tileHue } from "@/lib/format"

export function Panel({
  title,
  aside,
  children,
  className = "",
}: {
  title?: ReactNode
  aside?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`overflow-hidden rounded-2xl border border-line bg-card ${className}`}>
      {title ? (
        <header className="flex min-h-12 flex-wrap items-center gap-x-3 gap-y-2 border-b border-line px-4 py-2.5">
          <h2 className="mr-auto text-sm font-medium">{title}</h2>
          {aside}
        </header>
      ) : null}
      {children}
    </section>
  )
}

export function Avatar({
  name,
  src,
  size = "md",
  shape = "round",
}: {
  name: string
  src?: string
  size?: "sm" | "md" | "lg" | "xl"
  shape?: "round" | "square"
}) {
  const box = { sm: "size-8 text-[11px]", md: "size-10 text-xs", lg: "size-12 text-sm", xl: "size-14 text-base sm:size-20 sm:text-xl" }[size]
  const radius = shape === "round" ? "rounded-full" : size === "xl" ? "rounded-2xl" : "rounded-lg"
  if (src) {
    return (
      // Xbox picture hosts vary, and some box art is served over http.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt="" className={`${box} ${radius} shrink-0 bg-raised object-cover ring-1 ring-white/10`} />
    )
  }
  const hue = tileHue(name)
  return (
    <span
      className={`${box} ${radius} grid shrink-0 place-items-center font-semibold text-white/90 ring-1 ring-white/10`}
      style={{ background: `linear-gradient(140deg, hsl(${hue} 38% 30%), hsl(${(hue + 40) % 360} 34% 16%))` }}
      aria-hidden
    >
      {initials(name)}
    </span>
  )
}

export function Meter({ value, className = "", color }: { value: number; className?: string; color?: string }) {
  const pct = Math.max(0, Math.min(100, value * 100))
  return (
    <span className={`block h-1 overflow-hidden rounded-full bg-white/[0.07] ${className}`}>
      <span
        className="block h-full rounded-full transition-[width] duration-700 ease-out"
        style={{ width: `${pct}%`, background: color ?? "var(--foreground)" }}
      />
    </span>
  )
}

export function Gs({
  value,
  className = "",
  unitClassName = "ml-0.5 text-[0.8em] text-muted",
}: {
  value: string
  className?: string
  unitClassName?: string
}) {
  return (
    <span className={`tabular-nums ${className}`}>
      {value}
      <span className={`font-normal ${unitClassName}`}>G</span>
    </span>
  )
}
