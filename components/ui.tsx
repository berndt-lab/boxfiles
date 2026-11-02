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
    <section className={`material light-strip relative overflow-hidden rounded-[20px] border border-line ${className}`}>
      {title ? (
        <header className="flex min-h-12 flex-wrap items-center gap-x-3 gap-y-2 border-b border-line px-4 py-2.5">
          <h2 className="label-mono mr-auto text-foreground/80">{title}</h2>
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

/** A progress bar lit in the ambient colors; pass `color` for a plain, unlit fill. */
export function Meter({ value, className = "", color }: { value: number; className?: string; color?: string }) {
  const pct = Math.max(0, Math.min(100, value * 100))
  return (
    <span className={`block h-1 rounded-full bg-white/[0.07] ${className}`}>
      <span
        className={`block h-full rounded-full transition-[width,background] duration-700 ease-out ${color ? "" : "ambient-glow"}`}
        style={{
          width: `${pct}%`,
          background: color ?? "linear-gradient(90deg, rgb(var(--ambient)), rgb(var(--ambient-2)))",
        }}
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

/** An editorial section opener: a mono index on the left, a big headline on the right, over a hairline. */
export function SectionHead({
  index,
  label,
  title,
  aside,
}: {
  index: string
  label: string
  title: ReactNode
  aside?: ReactNode
}) {
  return (
    <div className="grid gap-x-8 gap-y-4 border-t border-line pt-5 sm:grid-cols-12">
      <p className="label-mono text-muted sm:col-span-3">
        ({index}) {label}
      </p>
      <h2 className="display-em text-balance font-display text-4xl font-semibold leading-[0.95] tracking-[-0.045em] sm:col-span-7 sm:text-6xl">
        {title}
      </h2>
      {aside ? <div className="self-end sm:col-span-2 sm:text-right">{aside}</div> : null}
    </div>
  )
}

/** An endless ticker band. Content is rendered twice so the loop has no seam. */
export function Marquee({ children, seconds = 40 }: { children: ReactNode; seconds?: number }) {
  return (
    <div className="marquee relative overflow-hidden border-y border-line py-5 [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
      <div className="marquee-track flex w-max" style={{ ["--marquee-duration" as string]: `${seconds}s` }}>
        <div className="flex shrink-0 items-center">{children}</div>
        <div className="flex shrink-0 items-center" aria-hidden>
          {children}
        </div>
      </div>
    </div>
  )
}

/** Primary call to action: a light pill with an arrow that slides on hover. */
export function ArrowIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden>
      <path d="M4 12 12 4M5.5 4H12v6.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
