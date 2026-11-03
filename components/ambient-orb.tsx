/** A lit sphere with two tilted orbit rings, colored by the ambient lighting. Pure CSS, so it costs nothing to load. */
export function AmbientOrb({ className = "" }: { className?: string }) {
  return (
    <div className={`ambient-orb pointer-events-none ${className}`} aria-hidden>
      <div className="orb-halo" />
      <div className="orb-ring" style={{ ["--tilt" as string]: "rotateX(74deg) rotateY(-8deg)", ["--spin" as string]: "16s" }} />
      <div className="orb-core" />
      <div
        className="orb-ring orb-ring-alt"
        style={{ ["--tilt" as string]: "rotateX(66deg) rotateY(22deg)", ["--spin" as string]: "24s" }}
      />
    </div>
  )
}
