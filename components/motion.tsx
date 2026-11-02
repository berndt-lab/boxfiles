"use client"

import { animate, motion, useInView, useReducedMotion } from "motion/react"
import { useEffect, useRef, type ReactNode } from "react"

const ease = [0.22, 1, 0.36, 1] as const

/** Fades and lifts its content into place the first time it scrolls into view. */
export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion()
  if (reduce) return <div className={className}>{children}</div>
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: 0.9, ease, delay }}
    >
      {children}
    </motion.div>
  )
}

/** Headline lines that rise out of a mask one after another, like a title card. */
export function RevealLines({ lines, delay = 0 }: { lines: ReactNode[]; delay?: number }) {
  const reduce = useReducedMotion()
  return (
    <>
      {lines.map((line, index) => (
        <span key={index} className="block overflow-hidden pb-[0.06em]">
          {reduce ? (
            <span className="block">{line}</span>
          ) : (
            <motion.span
              className="block"
              initial={{ y: "110%" }}
              animate={{ y: 0 }}
              transition={{ duration: 1.1, ease, delay: delay + index * 0.09 }}
            >
              {line}
            </motion.span>
          )}
        </span>
      ))}
    </>
  )
}

/** A number that counts up from zero when it first comes into view. */
export function CountUp({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const reduce = useReducedMotion()

  useEffect(() => {
    const node = ref.current
    if (!node || !inView || reduce) return
    const controls = animate(0, value, {
      duration: 1.6,
      ease,
      onUpdate: (latest) => {
        node.textContent = Math.round(latest).toLocaleString("en-US")
      },
    })
    return () => controls.stop()
  }, [inView, reduce, value])

  return (
    <span ref={ref} className={className}>
      {value.toLocaleString("en-US")}
    </span>
  )
}
