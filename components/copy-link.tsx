"use client"

import { AnimatePresence, motion } from "motion/react"
import { useEffect, useState } from "react"

/** Copies `path` on this site, or the current page when no path is given. */
export function CopyLink({ path, label = "Copy link" }: { path?: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    if (!copied) return
    const id = window.setTimeout(() => setCopied(false), 2000)
    return () => window.clearTimeout(id)
  }, [copied])

  return (
    <button
      type="button"
      onClick={() => {
        const url = path ? new URL(path, window.location.origin).toString() : window.location.href
        navigator.clipboard.writeText(url).then(() => setCopied(true), () => setCopied(false))
      }}
      className="relative h-8 shrink-0 overflow-hidden rounded-full border border-line bg-background px-3.5 text-sm text-muted transition-colors hover:border-line-strong hover:text-foreground"
      aria-live="polite"
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={copied ? "copied" : "copy"}
          className="block"
          initial={{ y: 12, opacity: 0, filter: "blur(4px)" }}
          animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
          exit={{ y: -12, opacity: 0, filter: "blur(4px)" }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          {copied ? "Link copied" : label}
        </motion.span>
      </AnimatePresence>
    </button>
  )
}
