/** One line of fine print and the wordmark set across the full width, lit by the ambient colors. */
export function SiteFooter() {
  return (
    <footer className="relative z-[1] mt-32 overflow-hidden border-t border-line">
      <div className="shell label-mono flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-5 text-faint">
        <span>© boxfiles · Alpha</span>
        <span>Fan-made, independent of Microsoft · Data from Xbox Live</span>
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
