import Link from "next/link"

/** Closing credits: a mono fact sheet and the wordmark set huge across the full width, lit by the ambient colors. */
export function SiteFooter() {
  return (
    <footer className="relative z-[1] mt-32 overflow-hidden border-t border-line">
      <div className="shell grid gap-8 py-12 sm:grid-cols-12">
        <div className="sm:col-span-5">
          <p className="label-mono text-muted">(boxfiles)</p>
          <p className="mt-3 max-w-sm text-pretty text-sm text-muted">
            The achievement hunter&apos;s companion for Xbox. Know what to unlock next, out-score your friends, and share
            the rare ones.
          </p>
        </div>
        <div className="sm:col-span-3">
          <p className="label-mono text-muted">(Explore)</p>
          <ul className="mt-3 space-y-1.5 text-sm">
            <li>
              <Link href="/" className="text-foreground/80 transition-colors hover:text-foreground">
                Home
              </Link>
            </li>
            <li>
              <Link href="/#board" className="text-foreground/80 transition-colors hover:text-foreground">
                Leaderboard
              </Link>
            </li>
          </ul>
        </div>
        <div className="sm:col-span-4">
          <p className="label-mono text-muted">(Fine print)</p>
          <p className="mt-3 text-sm text-muted">
            Live data comes from Xbox Live when you sign in. Read-only. Fan-made and independent of Microsoft.
          </p>
        </div>
      </div>
      <div className="shell flex items-end justify-between border-t border-line py-4">
        <span className="label-mono text-faint">© boxfiles</span>
        <span className="label-mono text-faint">Alpha</span>
      </div>
      <p
        className="ambient-text pointer-events-none -mb-[0.22em] select-none text-center font-display text-[24vw] font-semibold leading-[0.8] tracking-[-0.055em] opacity-90 [mask-image:linear-gradient(180deg,black_35%,transparent)]"
        aria-hidden
      >
        boxfiles
      </p>
    </footer>
  )
}
